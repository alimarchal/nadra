<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NadraApiService
{
    private string $apiHost;

    private string $tokenUrl;

    private string $verifyUrl;

    private string $lastResultUrl;

    private string $clientId;

    private string $clientSecret;

    private ?string $accessToken;

    private string $authorizationScheme;

    private string $franchiseeId;

    private string $scope;

    public function __construct()
    {
        $this->apiHost = config('nadra.api_host');
        $this->tokenUrl = config('nadra.token_url');
        $this->verifyUrl = config('nadra.verify_url');
        $this->lastResultUrl = config('nadra.last_result_url');
        $this->clientId = config('nadra.client_id');
        $this->clientSecret = config('nadra.client_secret');
        $this->accessToken = config('nadra.access_token');
        $this->authorizationScheme = config('nadra.authorization_scheme', '');
        $this->franchiseeId = config('nadra.franchisee_id');
        $this->scope = config('nadra.scope');
    }

    /**
     * Get OAuth2 access token from NADRA API Gateway.
     *
     * @return array{access_token: string, token_type: string, expires_in: int, scope: string}
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function getAccessToken(): array
    {
        $cached = Cache::get('nadra_access_token');

        if ($cached) {
            return $cached;
        }

        $basicAuth = base64_encode($this->clientId.':'.$this->clientSecret);

        $response = Http::withHeaders([
            'Authorization' => 'Basic '.$basicAuth,
            'Content-Type' => 'application/x-www-form-urlencoded',
        ])
            ->asForm()
            ->post($this->apiHost.$this->tokenUrl, [
                'grant_type' => 'client_credentials',
                'scope' => $this->scope,
            ])
            ->throw();

        $tokenData = $response->json();

        $ttl = max(($tokenData['expires_in'] ?? 600) - 60, 60);
        Cache::put('nadra_access_token', $tokenData, $ttl);

        return $tokenData;
    }

    /**
     * Call NADRA MBVS verification endpoint.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function verify(array $payload): array
    {
        $payload['franchiseeId'] = $this->franchiseeId;

        Log::channel('daily')->info('NADRA MBVS Verify Request', [
            'citizen_number' => $payload['citizenNumber'] ?? 'N/A',
            'transaction_id' => $payload['transactionId'] ?? 'N/A',
        ]);

        $response = Http::withHeaders([
            'Authorization' => $this->authorizationHeader(),
            'X-IBM-Client-Id' => $this->clientId,
            'Content-Type' => 'application/json',
            'Accept' => 'text/plain',
        ])
            ->timeout(30)
            ->post($this->url($this->verifyUrl), $payload)
            ->throw();

        $result = $response->json();

        Log::channel('daily')->info('NADRA MBVS Verify Response', [
            'code' => $result['responseStatus']['code'] ?? 'N/A',
            'message' => $result['responseStatus']['message'] ?? 'N/A',
        ]);

        return $result;
    }

    /**
     * Get last verification result from NADRA.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function getLastVerificationResult(array $payload): array
    {
        $payload['franchiseeId'] = $this->franchiseeId;

        $response = Http::withHeaders([
            'Authorization' => $this->authorizationHeader(),
            'X-IBM-Client-Id' => $this->clientId,
            'Content-Type' => 'application/json',
            'Accept' => 'text/plain',
        ])
            ->timeout(30)
            ->post($this->url($this->lastResultUrl), $payload)
            ->throw();

        return $response->json();
    }

    /**
     * Generate a unique transaction ID: franchiseeId + 13-digit millisecond timestamp + 2 random digits.
     * Timestamp-based prefix ensures no collision with previously used IDs.
     */
    public function generateTransactionId(): string
    {
        $milliseconds = (string) (int) round(microtime(true) * 1000);
        $random = str_pad((string) random_int(0, 99), 2, '0', STR_PAD_LEFT);

        return $this->franchiseeId.$milliseconds.$random;
    }

    /**
     * Invalidate the cached access token.
     */
    public function invalidateToken(): void
    {
        Cache::forget('nadra_access_token');
    }

    private function authorizationHeader(): string
    {
        $token = $this->accessToken ?: ($this->getAccessToken()['access_token'] ?? '');
        $scheme = trim($this->authorizationScheme);

        return $scheme === '' ? $token : $scheme.' '.$token;
    }

    private function url(string $path): string
    {
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return rtrim($this->apiHost, '/').'/'.ltrim($path, '/');
    }
}

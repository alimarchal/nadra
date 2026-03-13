<?php

namespace App\Http\Controllers\NadraVerifications;

use App\Http\Controllers\Controller;
use App\Http\Requests\NadraVerifications\StoreNadraVerificationRequest;
use App\Http\Requests\NadraVerifications\UpdateNadraVerificationRequest;
use App\Models\NadraAreaName;
use App\Models\NadraFingerIndex;
use App\Models\NadraResponseCode;
use App\Models\NadraTemplateType;
use App\Models\NadraVerification;
use App\Services\NadraApiService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\LaravelPdf\Facades\Pdf;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Throwable;

class NadraVerificationController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:nadra-verification.view', only: ['index', 'show']),
            new Middleware('permission:nadra-verification.create', only: ['create', 'store']),
            new Middleware('permission:nadra-verification.update', only: ['edit', 'update']),
            new Middleware('permission:nadra-verification.delete', only: ['destroy']),
        ];
    }

    public function index(): Response
    {
        $this->authorize('viewAny', NadraVerification::class);

        $user = auth()->user();
        $canViewAll = $user->can('nadra-verification.view-all');

        $verifications = QueryBuilder::for(
            NadraVerification::query()
                ->with('user:id,name,email')
                ->when(! $canViewAll, fn (Builder $q) => $q->where('user_id', $user->id))
        )
            ->allowedFilters([
                AllowedFilter::partial('citizen_number'),
                AllowedFilter::exact('area_name'),
                AllowedFilter::exact('response_code'),
                AllowedFilter::exact('is_successful'),
                AllowedFilter::partial('session_id'),
                AllowedFilter::callback('date_from', function (Builder $query, mixed $value): void {
                    $query->whereDate('created_at', '>=', $value);
                }),
                AllowedFilter::callback('date_to', function (Builder $query, mixed $value): void {
                    $query->whereDate('created_at', '<=', $value);
                }),
            ])
            ->allowedSorts(['id', 'citizen_number', 'area_name', 'response_code', 'is_successful', 'created_at'])
            ->defaultSort('-created_at')
            ->paginate(15)
            ->withQueryString();

        $activeFilters = (array) request()->input('filter', []);

        return Inertia::render('nadra-verifications/index', [
            'verifications' => $verifications,
            'filters' => [
                'citizen_number' => $activeFilters['citizen_number'] ?? null,
                'area_name' => $activeFilters['area_name'] ?? null,
                'response_code' => $activeFilters['response_code'] ?? null,
                'is_successful' => $activeFilters['is_successful'] ?? null,
                'session_id' => $activeFilters['session_id'] ?? null,
                'date_from' => $activeFilters['date_from'] ?? null,
                'date_to' => $activeFilters['date_to'] ?? null,
            ],
            'sort' => request()->input('sort'),
            'areaNames' => NadraAreaName::query()->orderBy('label')->get(),
            'fingerIndexes' => NadraFingerIndex::query()->orderBy('id')->get(),
            'templateTypes' => NadraTemplateType::query()->orderBy('id')->get(),
            'responseCodes' => NadraResponseCode::query()->orderBy('code')->get(),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', NadraVerification::class);

        return Inertia::render('nadra-verifications/create', [
            'areaNames' => NadraAreaName::query()->orderBy('label')->get(),
            'fingerIndexes' => NadraFingerIndex::query()->orderBy('id')->get(),
            'templateTypes' => NadraTemplateType::query()->orderBy('id')->get(),
        ]);
    }

    public function store(StoreNadraVerificationRequest $request): RedirectResponse
    {
        $this->authorize('create', NadraVerification::class);

        $validated = $request->validated();

        try {
            DB::transaction(function () use ($validated, $request): void {
                NadraVerification::query()->create([
                    'user_id' => $request->user()->id,
                    'session_id' => $validated['session_id'] ?? null,
                    'citizen_number' => $validated['citizen_number'],
                    'citizen_contact_number' => $validated['citizen_contact_number'] ?? null,
                    'finger_index' => $validated['finger_index'] ?? null,
                    'template_type' => $validated['template_type'] ?? null,
                    'finger_template' => $validated['finger_template'] ?? null,
                    'photograph' => $validated['photograph'] ?? null,
                    'transaction_id' => app(NadraApiService::class)->generateTransactionId(),
                    'area_name' => $validated['area_name'],
                    'client_branch_id' => $validated['client_branch_id'],
                    'client_machine_identifier' => $validated['client_machine_identifier'],
                    'client_session_id' => $validated['client_session_id'],
                    'client_timestamp' => $validated['client_timestamp'],
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                ]);
            });

            return to_route('nadra-verifications.index')->with('success', 'Verification record created successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->withInput()
                ->withErrors(['nadra' => 'Unable to create verification record. Please try again.']);
        }
    }

    public function show(NadraVerification $nadraVerification): Response
    {
        $this->authorize('view', $nadraVerification);

        $nadraVerification->load('user:id,name,email');

        return Inertia::render('nadra-verifications/show', [
            'verification' => $nadraVerification,
            'responseCodes' => NadraResponseCode::query()->orderBy('code')->get(),
            'reportFooterText' => config('nadra.report_footer_text'),
        ]);
    }

    public function downloadPdf(NadraVerification $nadraVerification)
    {
        $this->authorize('view', $nadraVerification);

        $nadraVerification->load('user:id,name,email');

        $responseCodeMessage = NadraResponseCode::query()
            ->where('code', $nadraVerification->response_code)
            ->value('message');

        $statusLabel = $nadraVerification->is_successful
            ? 'VERIFIED'
            : ($nadraVerification->response_code ? 'FAILED' : 'PENDING');

        return Pdf::view('pdf.nadra-verification-report', [
            'verification' => $nadraVerification,
            'responseCodeMessage' => $responseCodeMessage,
            'statusLabel' => $statusLabel,
            'reportFooterText' => config('nadra.report_footer_text'),
        ])
            ->name($nadraVerification->citizen_number.'.pdf')
            ->download();
    }

    public function edit(NadraVerification $nadraVerification): Response
    {
        $this->authorize('update', $nadraVerification);

        $nadraVerification->load('user:id,name,email');

        return Inertia::render('nadra-verifications/edit', [
            'verification' => $nadraVerification,
            'areaNames' => NadraAreaName::query()->orderBy('label')->get(),
            'fingerIndexes' => NadraFingerIndex::query()->orderBy('id')->get(),
            'templateTypes' => NadraTemplateType::query()->orderBy('id')->get(),
        ]);
    }

    public function update(UpdateNadraVerificationRequest $request, NadraVerification $nadraVerification): RedirectResponse
    {
        $this->authorize('update', $nadraVerification);

        $validated = $request->validated();

        try {
            DB::transaction(function () use ($nadraVerification, $validated): void {
                $nadraVerification->update([
                    'citizen_number' => $validated['citizen_number'],
                    'citizen_contact_number' => $validated['citizen_contact_number'] ?? null,
                    'finger_index' => $validated['finger_index'] ?? null,
                    'template_type' => $validated['template_type'] ?? null,
                    'finger_template' => $validated['finger_template'] ?? null,
                    'photograph' => $validated['photograph'] ?? null,
                    'area_name' => $validated['area_name'],
                    'client_branch_id' => $validated['client_branch_id'],
                    'client_machine_identifier' => $validated['client_machine_identifier'],
                    'client_session_id' => $validated['client_session_id'],
                    'client_timestamp' => $validated['client_timestamp'],
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                ]);
            });

            return to_route('nadra-verifications.index')->with('success', 'Verification record updated successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return back()->withInput()
                ->withErrors(['nadra' => 'Unable to update verification record. Please try again.']);
        }
    }

    public function destroy(NadraVerification $nadraVerification): RedirectResponse
    {
        $this->authorize('delete', $nadraVerification);

        try {
            DB::transaction(function () use ($nadraVerification): void {
                $nadraVerification->delete();
            });

            return to_route('nadra-verifications.index')->with('success', 'Verification record deleted successfully.');
        } catch (Throwable $exception) {
            report($exception);

            return to_route('nadra-verifications.index')->with('error', 'Unable to delete verification record.');
        }
    }

    public function callApi(Request $request, NadraVerification $nadraVerification): RedirectResponse
    {
        $this->authorize('callApi', $nadraVerification);

        try {
            $service = app(NadraApiService::class);

            $payload = [
                'sessionId' => $nadraVerification->session_id ?? '',
                'franchiseeId' => config('nadra.franchisee_id'),
                'transactionId' => $nadraVerification->transaction_id,
                'citizenNumber' => $nadraVerification->citizen_number,
                'citizenContactNumber' => $nadraVerification->citizen_contact_number ?? '',
                'fingerIndex' => $nadraVerification->finger_index,
                'templateType' => $nadraVerification->template_type,
                'fingerTemplate' => $nadraVerification->finger_template,
                'photograph' => $nadraVerification->photograph,
                'areaName' => strtolower($nadraVerification->area_name),
                'clientBranchId' => $nadraVerification->client_branch_id,
                'clientMachineIdentifier' => $nadraVerification->client_machine_identifier,
                'clientSessionId' => $nadraVerification->client_session_id,
                'clientTimeStamp' => $nadraVerification->client_timestamp,
                'latitude' => (float) $nadraVerification->latitude,
                'longitude' => (float) $nadraVerification->longitude,
            ];

            $response = $service->verify($payload);

            $nadraVerification->update([
                'session_id' => $response['sessionId'] ?? $nadraVerification->session_id,
                'response_code' => $response['responseStatus']['code'] ?? null,
                'response_message' => $response['responseStatus']['message'] ?? null,
                'facial_result' => $response['modalityResult']['facialResult'] ?? null,
                'fingerprint_result' => $response['modalityResult']['fingerprintResult'] ?? null,
                'citizen_data' => $response['citizenData'] ?? null,
                'available_fingers' => $response['fingerIndex'] ?? null,
                'is_successful' => ($response['responseStatus']['code'] ?? '') === '100',
                'raw_request' => $payload,
                'raw_response' => $response,
            ]);

            $code = $response['responseStatus']['code'] ?? 'N/A';
            $message = $response['responseStatus']['message'] ?? 'Unknown response';

            if ($code === '100') {
                return to_route('nadra-verifications.show', $nadraVerification)
                    ->with('success', "Verification successful! (Code: {$code})");
            }

            return to_route('nadra-verifications.show', $nadraVerification)
                ->with('error', "NADRA Response: {$message} (Code: {$code})");
        } catch (Throwable $exception) {
            report($exception);

            $nadraVerification->update([
                'raw_response' => ['error' => $exception->getMessage()],
            ]);

            return to_route('nadra-verifications.show', $nadraVerification)
                ->with('error', 'API call failed: '.$exception->getMessage());
        }
    }

    public function getLastResult(NadraVerification $nadraVerification): RedirectResponse
    {
        $this->authorize('callApi', $nadraVerification);

        try {
            $service = app(NadraApiService::class);

            $payload = [
                'franchiseeId' => config('nadra.franchisee_id'),
                'transactionId' => $nadraVerification->transaction_id,
                'citizenNumber' => $nadraVerification->citizen_number,
            ];

            $response = $service->getLastVerificationResult($payload);

            $nadraVerification->update([
                'response_code' => $response['responseStatus']['code'] ?? $nadraVerification->response_code,
                'response_message' => $response['responseStatus']['message'] ?? $nadraVerification->response_message,
                'citizen_data' => $response['citizenData'] ?? $nadraVerification->citizen_data,
                'is_successful' => ($response['responseStatus']['code'] ?? '') === '100',
                'raw_response' => $response,
            ]);

            $code = $response['responseStatus']['code'] ?? 'N/A';
            $message = $response['responseStatus']['message'] ?? 'Unknown';

            return to_route('nadra-verifications.show', $nadraVerification)
                ->with('success', "Last result fetched: {$message} (Code: {$code})");
        } catch (Throwable $exception) {
            report($exception);

            return to_route('nadra-verifications.show', $nadraVerification)
                ->with('error', 'Failed to get last result: '.$exception->getMessage());
        }
    }
}

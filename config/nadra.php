<?php

return [
    'api_host' => env('NADRA_API_HOST', 'https://api.nadra.gov.pk'),
    'token_url' => env('NADRA_TOKEN_URL', '/nadra/testing/oauth/oauth2/token'),
    'verify_url' => env('NADRA_VERIFY_URL', '/nadra/testing/multibio/verifymbvs'),
    'last_result_url' => env('NADRA_LAST_RESULT_URL', '/nadra/testing/multibio/getlastverifymbvsverificatioresult'),
    'client_id' => env('NADRA_CLIENT_ID', ''),
    'client_secret' => env('NADRA_CLIENT_SECRET', ''),
    'franchisee_id' => env('NADRA_FRANCHISEE_ID', ''),
    'scope' => env('NADRA_SCOPE', 'NADRAAPI'),
];

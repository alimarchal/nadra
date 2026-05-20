<?php

return [
    'api_host' => env('NADRA_API_HOST', 'https://stagendel.nadra.gov.pk'),
    'token_url' => env('NADRA_TOKEN_URL', '/nadra/testing/oauth/oauth2/token'),
    'verify_url' => env('NADRA_VERIFY_URL', '/mbvs/v1/mbvsstandard/verifymbvs'),
    'last_result_url' => env('NADRA_LAST_RESULT_URL', '/nadra/testing/multibio/getlastverifymbvsverificatioresult'),
    'client_id' => env('NADRA_CLIENT_ID', ''),
    'client_secret' => env('NADRA_CLIENT_SECRET', ''),
    'access_token' => env('NADRA_ACCESS_TOKEN'),
    'authorization_scheme' => env('NADRA_AUTHORIZATION_SCHEME', ''),
    'franchisee_id' => env('NADRA_FRANCHISEE_ID', ''),
    'scope' => env('NADRA_SCOPE', 'NADRAAPI'),
    'report_footer_text' => env('NADRA_REPORT_FOOTER_TEXT', 'Developed By Ali Raza Marchal (IT Division - The Bank of Azad Jammu and Kashmir)'),
];

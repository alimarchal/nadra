<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>NADRA Verification Report - {{ $verification->citizen_number }}</title>
    <style>
        @page {
            margin: 6mm 8mm 10mm;
        }

        body {
            margin: 0;
            color: #000;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 4px;
        }

        .header-title {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.4px;
        }

        .header-subtitle {
            margin: 1px 0 0;
            font-size: 11px;
        }

        .section-title {
            margin-top: 3px;
            border: 1px solid #000;
            border-bottom: 0;
            background: #000;
            color: #fff;
            padding: 2px 5px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
        }

        table {
            width: 100%;
            border: 1px solid #000;
            border-collapse: collapse;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 3px 5px;
            text-align: left;
            vertical-align: top;
            font-size: 10px;
        }

        th {
            width: 24%;
            background: #000;
            color: #fff;
            font-weight: 700;
        }

        .media-table th {
            width: 50%;
            text-align: center;
        }

        .media-table td {
            text-align: center;
            vertical-align: middle;
            padding: 4px;
        }

        .media-frame {
            width: 170px;
            height: 130px;
            margin: 0 auto;
            border: 1px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .media-frame img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
        }

        .media-empty {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 2px;
            text-align: center;
            font-size: 10px;
        }

        pre {
            margin: 0;
            border: 1px solid #000;
            border-top: 0;
            padding: 4px;
            font-size: 9px;
            line-height: 1.2;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid #000;
            padding: 2mm 8mm;
            background: #fff;
            font-size: 9px;
        }

        .page-number::after {
            content: "Page " counter(page) " of " counter(pages);
        }
    </style>
</head>

<body>
    <div class="header">
        <div>
            <h1 class="header-title">NADRA VERIFICATION REPORT</h1>
            <p class="header-subtitle">Bank of Azad Jammu & Kashmir</p>
            <p class="header-subtitle">Generated: {{ now()->format('d/m/Y h:i A') }}</p>
        </div>
        <img src="{{ asset('icons-images/BAJK logo.png') }}" alt="BAJK Logo"
            style="height: 80px; width: auto; object-fit: contain;">
    </div>

    <table>
        <tbody>
            <tr>
                <th>Verification ID</th>
                <td>{{ $verification->id }}</td>
                <th>Status</th>
                <td>{{ $statusLabel }}</td>
            </tr>
            <tr>
                <th>Response Code</th>
                <td>{{ $verification->response_code ?? '-' }}</td>
                <th>Response Message</th>
                <td>{{ $responseCodeMessage ?? $verification->response_message ?? '-' }}</td>
            </tr>
            <tr>
                <th>Facial Result</th>
                <td>{{ $verification->facial_result ?? '-' }}</td>
                <th>Fingerprint Result</th>
                <td>{{ $verification->fingerprint_result ?? '-' }}</td>
            </tr>
            <tr>
                <th>Created At</th>
                <td>{{ optional($verification->created_at)->format('d/m/Y h:i A') }}</td>
                <th>Updated At</th>
                <td>{{ optional($verification->updated_at)->format('d/m/Y h:i A') }}</td>
            </tr>
        </tbody>
    </table>

    <h2 class="section-title">Citizen Information</h2>
    <table>
        <tbody>
            <tr>
                <th>CNIC Number</th>
                <td>{{ $verification->citizen_number }}</td>
                <th>Contact Number</th>
                <td>{{ $verification->citizen_contact_number ?? '-' }}</td>
            </tr>
            <tr>
                <th>Area Name</th>
                <td>{{ $verification->area_name }}</td>
                <th>Submitted By</th>
                <td>{{ $verification->user?->name ?? '-' }} ({{ $verification->user?->email ?? '-' }})</td>
            </tr>
            <tr>
                <th>Created By User ID</th>
                <td>{{ $verification->user?->id ?? $verification->user_id }}</td>
                <th>Created By Email</th>
                <td>{{ $verification->user?->email ?? '-' }}</td>
            </tr>
        </tbody>
    </table>

    <h2 class="section-title">Biometric Information</h2>
    <table>
        <tbody>
            <tr>
                <th>Finger Index</th>
                <td>{{ $verification->finger_index ?? '-' }}</td>
                <th>Template Type</th>
                <td>{{ $verification->template_type ?? '-' }}</td>
            </tr>
            <tr>
                <th>Has Fingerprint</th>
                <td>{{ $verification->finger_template ? 'Yes' : 'No' }}</td>
                <th>Has Photograph</th>
                <td>{{ $verification->photograph ? 'Yes' : 'No' }}</td>
            </tr>
            <tr>
                <th>Available Fingers</th>
                <td colspan="3">
                    {{ is_array($verification->available_fingers) ? implode(', ', $verification->available_fingers) : '-' }}
                </td>
            </tr>
        </tbody>
    </table>

    <h2 class="section-title">BIOMETRIC IMAGES</h2>
    <table class="media-table">
        <thead>
            <tr>
                <th>Citizen Photograph</th>
                <th>Fingerprint Image</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <div class="media-frame">
                        @if($verification->photograph)
                            <img src="data:image/jpeg;base64,{{ $verification->photograph }}" alt="Citizen Photograph">
                        @else
                            <div class="media-empty">Photograph not available</div>
                        @endif
                    </div>
                </td>
                <td>
                    <div class="media-frame">
                        @if($verification->finger_template)
                            <img src="data:image/png;base64,{{ $verification->finger_template }}" alt="Fingerprint">
                        @else
                            <div class="media-empty">Fingerprint not available</div>
                        @endif
                    </div>
                </td>
            </tr>
        </tbody>
    </table>

    <h2 class="section-title">Session and Client Information</h2>
    <table>
        <tbody>
            <tr>
                <th>Session ID</th>
                <td>{{ $verification->session_id ?? '-' }}</td>
                <th>Transaction ID</th>
                <td>{{ $verification->transaction_id }}</td>
            </tr>
            <tr>
                <th>Client Branch ID</th>
                <td>{{ $verification->client_branch_id }}</td>
                <th>Machine Identifier</th>
                <td>{{ $verification->client_machine_identifier }}</td>
            </tr>
            <tr>
                <th>Client Session ID</th>
                <td>{{ $verification->client_session_id }}</td>
                <th>Client Timestamp</th>
                <td>{{ $verification->client_timestamp }}</td>
            </tr>
            <tr>
                <th>Latitude</th>
                <td>{{ $verification->latitude }}</td>
                <th>Longitude</th>
                <td>{{ $verification->longitude }}</td>
            </tr>
        </tbody>
    </table>

    <h2 class="section-title">Citizen Data</h2>
    <pre>{{ $verification->citizen_data ? json_encode($verification->citizen_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '-' }}</pre>

    <h2 class="section-title">Raw Request</h2>
    <pre>{{ $verification->raw_request ? json_encode($verification->raw_request, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '-' }}</pre>

    <h2 class="section-title">Raw Response</h2>
    <pre>{{ $verification->raw_response ? json_encode($verification->raw_response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '-' }}</pre>

    <div class="footer">
        <span>{{ $reportFooterText }}</span>
        <span class="page-number"></span>
    </div>
</body>

</html>
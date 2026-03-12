<?php

namespace App\Http\Requests\NadraVerifications;

use Illuminate\Foundation\Http\FormRequest;

class StoreNadraVerificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('nadra-verification.create') ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'citizen_number' => ['required', 'string', 'size:13', 'regex:/^\d{13}$/'],
            'citizen_contact_number' => ['nullable', 'string', 'max:16'],
            'finger_index' => ['nullable', 'string', 'in:RIGHT_THUMB,RIGHT_INDEX,RIGHT_MIDDLE,RIGHT_RING,RIGHT_LITTLE,LEFT_THUMB,LEFT_INDEX,LEFT_MIDDLE,LEFT_RING,LEFT_LITTLE'],
            'template_type' => ['nullable', 'string', 'in:ANSI,ISO_19794_2,SAGEM_PKMAT,SAGEM_PKCOMPV2,SAGEM_CFV,RAW_IMAGE,WSQ'],
            'finger_template' => ['nullable', 'string'],
            'photograph' => ['nullable', 'string'],
            'area_name' => ['required', 'string', 'in:KPK,FATA,PUNJAB,SINDH,ISLAMABAD,GILGIT_BALTISTAN,BALUCHISTAN,AZAD_KASHMIR'],
            'client_branch_id' => ['required', 'string', 'max:32'],
            'client_machine_identifier' => ['required', 'string', 'max:64'],
            'client_session_id' => ['required', 'string', 'max:64'],
            'client_timestamp' => ['required', 'string', 'max:64'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'session_id' => ['nullable', 'string', 'max:19'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'citizen_number.required' => 'CNIC number is required.',
            'citizen_number.size' => 'CNIC must be exactly 13 digits.',
            'citizen_number.regex' => 'CNIC must contain only digits.',
            'finger_index.in' => 'Invalid finger index selected.',
            'template_type.in' => 'Invalid template type selected.',
            'area_name.required' => 'Area name is required.',
            'area_name.in' => 'Invalid area name selected.',
            'latitude.required' => 'Latitude is required.',
            'longitude.required' => 'Longitude is required.',
        ];
    }
}

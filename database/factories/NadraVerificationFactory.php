<?php

namespace Database\Factories;

use App\Models\NadraVerification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NadraVerification>
 */
class NadraVerificationFactory extends Factory
{
    protected $model = NadraVerification::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $areaNames = ['KPK', 'FATA', 'PUNJAB', 'SINDH', 'ISLAMABAD', 'GILGIT_BALTISTAN', 'BALUCHISTAN', 'AZAD_KASHMIR'];
        $fingerIndexes = ['RIGHT_THUMB', 'RIGHT_INDEX', 'RIGHT_MIDDLE', 'RIGHT_RING', 'RIGHT_LITTLE', 'LEFT_THUMB', 'LEFT_INDEX', 'LEFT_MIDDLE', 'LEFT_RING', 'LEFT_LITTLE'];
        $templateTypes = ['ANSI', 'ISO_19794_2', 'SAGEM_PKMAT', 'SAGEM_PKCOMPV2', 'SAGEM_CFV', 'RAW_IMAGE', 'WSQ'];
        $franchiseeId = config('nadra.franchisee_id', '9999');

        return [
            'user_id' => User::factory(),
            'session_id' => null,
            'citizen_number' => $this->faker->numerify('#############'),
            'citizen_contact_number' => '03'.$this->faker->numerify('#########'),
            'finger_index' => $this->faker->randomElement($fingerIndexes),
            'template_type' => $this->faker->randomElement($templateTypes),
            'finger_template' => null,
            'photograph' => null,
            'transaction_id' => $franchiseeId.str_pad((string) $this->faker->unique()->randomNumber(9), 15, '0', STR_PAD_LEFT),
            'area_name' => $this->faker->randomElement($areaNames),
            'client_branch_id' => $this->faker->numerify('######'),
            'client_machine_identifier' => $this->faker->macAddress(),
            'client_session_id' => (string) $this->faker->unique()->randomNumber(9),
            'client_timestamp' => now()->format('d/m/Y'),
            'latitude' => $this->faker->latitude(24, 37),
            'longitude' => $this->faker->longitude(61, 77),
            'response_code' => null,
            'response_message' => null,
            'facial_result' => null,
            'fingerprint_result' => null,
            'citizen_data' => null,
            'available_fingers' => null,
            'raw_request' => null,
            'raw_response' => null,
            'is_successful' => false,
        ];
    }

    public function successful(): static
    {
        return $this->state(fn (): array => [
            'response_code' => '100',
            'response_message' => 'successful',
            'facial_result' => 'MATCH',
            'fingerprint_result' => 'MATCH',
            'is_successful' => true,
            'session_id' => '100110000000019'.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (): array => [
            'response_code' => '127',
            'response_message' => 'facial/fingerprint modalities could not be verified',
            'facial_result' => 'MATCH',
            'fingerprint_result' => 'NOT_MATCH',
            'is_successful' => false,
            'session_id' => '100110000000028'.str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT),
            'available_fingers' => ['RIGHT_THUMB', 'LEFT_THUMB', 'LEFT_INDEX', 'LEFT_MIDDLE'],
        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\NadraAreaName;
use App\Models\NadraFingerIndex;
use App\Models\NadraResponseCode;
use App\Models\NadraTemplateType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class NadraEnumerationsSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $this->seedAreaNames();
            $this->seedFingerIndexes();
            $this->seedTemplateTypes();
            $this->seedResponseCodes();
        });
    }

    private function seedAreaNames(): void
    {
        $areas = [
            ['name' => 'KPK', 'label' => 'Khyber Pakhtunkhwa'],
            ['name' => 'FATA', 'label' => 'Federally Administered Tribal Areas'],
            ['name' => 'PUNJAB', 'label' => 'Punjab'],
            ['name' => 'SINDH', 'label' => 'Sindh'],
            ['name' => 'ISLAMABAD', 'label' => 'Islamabad Capital Territory'],
            ['name' => 'GILGIT_BALTISTAN', 'label' => 'Gilgit-Baltistan'],
            ['name' => 'BALUCHISTAN', 'label' => 'Baluchistan'],
            ['name' => 'AZAD_KASHMIR', 'label' => 'Azad Jammu & Kashmir'],
        ];

        foreach ($areas as $area) {
            NadraAreaName::query()->firstOrCreate(
                ['name' => $area['name']],
                ['label' => $area['label']],
            );
        }
    }

    private function seedFingerIndexes(): void
    {
        $fingers = [
            ['name' => 'RIGHT_THUMB', 'label' => 'Right Thumb'],
            ['name' => 'RIGHT_INDEX', 'label' => 'Right Index Finger'],
            ['name' => 'RIGHT_MIDDLE', 'label' => 'Right Middle Finger'],
            ['name' => 'RIGHT_RING', 'label' => 'Right Ring Finger'],
            ['name' => 'RIGHT_LITTLE', 'label' => 'Right Little Finger'],
            ['name' => 'LEFT_THUMB', 'label' => 'Left Thumb'],
            ['name' => 'LEFT_INDEX', 'label' => 'Left Index Finger'],
            ['name' => 'LEFT_MIDDLE', 'label' => 'Left Middle Finger'],
            ['name' => 'LEFT_RING', 'label' => 'Left Ring Finger'],
            ['name' => 'LEFT_LITTLE', 'label' => 'Left Little Finger'],
        ];

        foreach ($fingers as $finger) {
            NadraFingerIndex::query()->firstOrCreate(
                ['name' => $finger['name']],
                ['label' => $finger['label']],
            );
        }
    }

    private function seedTemplateTypes(): void
    {
        $types = [
            ['name' => 'ANSI', 'label' => 'ANSI'],
            ['name' => 'ISO_19794_2', 'label' => 'ISO 19794-2'],
            ['name' => 'SAGEM_PKMAT', 'label' => 'Sagem PKMAT'],
            ['name' => 'SAGEM_PKCOMPV2', 'label' => 'Sagem PKCOMP V2'],
            ['name' => 'SAGEM_CFV', 'label' => 'Sagem CFV'],
            ['name' => 'RAW_IMAGE', 'label' => 'Raw Image'],
            ['name' => 'WSQ', 'label' => 'WSQ'],
        ];

        foreach ($types as $type) {
            NadraTemplateType::query()->firstOrCreate(
                ['name' => $type['name']],
                ['label' => $type['label']],
            );
        }
    }

    private function seedResponseCodes(): void
    {
        $codes = [
            ['code' => '100', 'message' => 'successful'],
            ['code' => '104', 'message' => 'invalid session id'],
            ['code' => '106', 'message' => 'Invalid franchisee id'],
            ['code' => '107', 'message' => 'invalid citizen number'],
            ['code' => '108', 'message' => 'citizen verification Service is down. Please try again later.'],
            ['code' => '109', 'message' => 'exception: System has encountered an exception. Administrator has been informed, please try again later'],
            ['code' => '110', 'message' => 'citizen number is not verified'],
            ['code' => '111', 'message' => 'fingerprints does not exist in citizen database'],
            ['code' => '112', 'message' => 'error generating session id'],
            ['code' => '115', 'message' => 'invalid service provider transaction id'],
            ['code' => '116', 'message' => 'citizen number does not exist in test data lookup'],
            ['code' => '118', 'message' => 'finger verification has been exhausted for current finger.'],
            ['code' => '119', 'message' => 'verification limit for current citizen number has been exhausted'],
            ['code' => '120', 'message' => 'invalid input finger template'],
            ['code' => '121', 'message' => 'invalid finger index'],
            ['code' => '123', 'message' => 'invalid finger template type'],
            ['code' => '124', 'message' => 'contact number is not valid'],
            ['code' => '127', 'message' => 'facial/fingerprint modalities could not be verified'],
            ['code' => '142', 'message' => 'cnic does not exists in NADRA database'],
            ['code' => '151', 'message' => 'no request found against citizen number/transaction id'],
            ['code' => '152', 'message' => 'last verification was not successful'],
            ['code' => '175', 'message' => 'transaction id already exist'],
            ['code' => '176', 'message' => 'citizen number does not exist client lookup data'],
            ['code' => '180', 'message' => 'daily verification limit has been exhausted for testing'],
            ['code' => '184', 'message' => 'invalid area name'],
            ['code' => '186', 'message' => 'invalid longitude'],
            ['code' => '187', 'message' => 'invalid latitude'],
            ['code' => '201', 'message' => 'session has been expired'],
            ['code' => '202', 'message' => 'verification was successful therefore session has been expired'],
            ['code' => '260', 'message' => 'invalid client branch id'],
            ['code' => '261', 'message' => 'invalid client session id'],
            ['code' => '262', 'message' => 'invalid client machine identifier'],
            ['code' => '263', 'message' => 'invalid client timestamp'],
            ['code' => '300', 'message' => 'verification not allowed after office hours and on holidays'],
            ['code' => '317', 'message' => 'total verification quota has been exhausted'],
            ['code' => '318', 'message' => 'daily verification quota has been exhausted'],
            ['code' => '319', 'message' => 'contact number is not registered against citizen'],
        ];

        foreach ($codes as $code) {
            NadraResponseCode::query()->firstOrCreate(
                ['code' => $code['code']],
                ['message' => $code['message']],
            );
        }
    }
}

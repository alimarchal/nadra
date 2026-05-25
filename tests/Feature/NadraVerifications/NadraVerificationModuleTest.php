<?php

use App\Models\NadraVerification;
use App\Models\User;
use Database\Seeders\NadraEnumerationsSeeder;
use Illuminate\Http\Client\Request as ClientRequest;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    $permissions = [
        'nadra-verification.view',
        'nadra-verification.view-all',
        'nadra-verification.create',
        'nadra-verification.update',
        'nadra-verification.delete',
        'nadra-verification.call-api',
    ];

    foreach ($permissions as $name) {
        Permission::findOrCreate($name, 'web');
    }

    $adminRole = Role::findOrCreate('admin', 'web');
    $adminRole->syncPermissions([
        'nadra-verification.view',
        'nadra-verification.view-all',
        'nadra-verification.create',
        'nadra-verification.update',
        'nadra-verification.call-api',
    ]);

    Role::findOrCreate('operator', 'web')->syncPermissions([
        'nadra-verification.view',
        'nadra-verification.create',
    ]);

    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

// --- Access control ---

test('guests cannot access nadra verification routes', function (): void {
    $this->get(route('nadra-verifications.index'))->assertRedirect(route('login'));
});

test('users without permissions cannot access verification listing', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('nadra-verifications.index'))
        ->assertForbidden();
});

test('admin can view verification listing', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('nadra-verifications.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('nadra-verifications/index')
            ->has('verifications.data')
            ->has('filters')
            ->has('areaNames')
            ->has('responseCodes'),
        );
});

// --- Own-data scoping ---

test('operator can only see own verification records', function (): void {
    $operator = User::factory()->create();
    $operator->assignRole('operator');

    $ownRecord = NadraVerification::factory()->create(['user_id' => $operator->id]);
    $otherRecord = NadraVerification::factory()->create();

    $this->actingAs($operator)
        ->get(route('nadra-verifications.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('nadra-verifications/index')
            ->has('verifications.data', 1)
            ->where('verifications.data.0.id', $ownRecord->id),
        );
});

test('admin with view-all can see all verification records', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    NadraVerification::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('nadra-verifications.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('nadra-verifications/index')
            ->has('verifications.data', 3),
        );
});

// --- CRUD create ---

test('admin can view create verification form', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('nadra-verifications.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('nadra-verifications/create')
            ->has('areaNames')
            ->has('fingerIndexes')
            ->has('templateTypes'),
        );
});

test('admin can store a verification record', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post(route('nadra-verifications.store'), [
            'citizen_number' => '6110119876547',
            'area_name' => 'PUNJAB',
            'client_branch_id' => '123456',
            'client_machine_identifier' => 'ac-de-hf-qw-03',
            'client_session_id' => '7894561234545',
            'client_timestamp' => '12/03/2026',
            'latitude' => '33.761000',
            'longitude' => '73.096000',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('nadra_verifications', [
        'citizen_number' => '6110119876547',
        'area_name' => 'PUNJAB',
        'user_id' => $admin->id,
    ]);
});

test('store validation rejects invalid CNIC', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->post(route('nadra-verifications.store'), [
            'citizen_number' => '123',
            'area_name' => 'PUNJAB',
            'client_branch_id' => '123456',
            'client_machine_identifier' => 'ac-de-hf-qw-03',
            'client_session_id' => '7894561234545',
            'client_timestamp' => '12/03/2026',
            'latitude' => '33.761000',
            'longitude' => '73.096000',
        ])
        ->assertSessionHasErrors('citizen_number');
});

// --- CRUD show ---

test('admin can view a verification record', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $record = NadraVerification::factory()->successful()->create();

    $this->actingAs($admin)
        ->get(route('nadra-verifications.show', $record))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('nadra-verifications/show')
            ->has('verification')
            ->where('verification.id', $record->id)
            ->has('responseCodes'),
        );
});

test('operator cannot view another users verification record', function (): void {
    $operator = User::factory()->create();
    $operator->assignRole('operator');

    $otherRecord = NadraVerification::factory()->create();

    $this->actingAs($operator)
        ->get(route('nadra-verifications.show', $otherRecord))
        ->assertForbidden();
});

// --- CRUD edit/update ---

test('admin can view edit form for a verification record', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $record = NadraVerification::factory()->create();

    $this->actingAs($admin)
        ->get(route('nadra-verifications.edit', $record))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('nadra-verifications/edit')
            ->has('verification')
            ->has('areaNames')
            ->has('fingerIndexes')
            ->has('templateTypes'),
        );
});

test('admin can update a verification record', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $record = NadraVerification::factory()->create();

    $this->actingAs($admin)
        ->put(route('nadra-verifications.update', $record), [
            'citizen_number' => '1234567890123',
            'area_name' => 'SINDH',
            'client_branch_id' => '654321',
            'client_machine_identifier' => 'xx-yy-zz-aa-01',
            'client_session_id' => '9999999999999',
            'client_timestamp' => '15/03/2026',
            'latitude' => '24.860000',
            'longitude' => '67.010000',
        ])
        ->assertRedirect(route('nadra-verifications.index'));

    $this->assertDatabaseHas('nadra_verifications', [
        'id' => $record->id,
        'citizen_number' => '1234567890123',
        'area_name' => 'SINDH',
    ]);
});

test('admin can call nadra verify api with mbvs standard payload', function (): void {
    config([
        'nadra.api_host' => 'https://stagendel.nadra.gov.pk',
        'nadra.verify_url' => '/mbvs/v1/mbvsstandard/verifymbvs',
        'nadra.client_id' => 'client-id',
        'nadra.access_token' => 'test-access-token',
        'nadra.authorization_scheme' => '',
        'nadra.franchisee_id' => '6820',
    ]);

    Http::fake([
        'https://stagendel.nadra.gov.pk/mbvs/v1/mbvsstandard/verifymbvs' => Http::response([
            'sessionId' => 'nadra-session-id',
            'responseStatus' => [
                'code' => '100',
                'message' => 'successful',
            ],
            'modalityResult' => [
                'facialResult' => 'MATCH',
                'fingerprintResult' => 'MATCH',
            ],
            'citizenData' => [
                'name' => 'Test Citizen',
            ],
            'fingerIndex' => ['RIGHT_THUMB'],
        ], 200, ['Content-Type' => 'text/plain']),
    ]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $record = NadraVerification::factory()->create([
        'session_id' => null,
        'transaction_id' => '6820778146332862003',
        'citizen_number' => '8224343808313',
        'citizen_contact_number' => '03008169924',
        'finger_index' => 'RIGHT_THUMB',
        'template_type' => 'RAW_IMAGE',
        'finger_template' => 'finger-template-base64',
        'photograph' => 'photograph-base64',
        'area_name' => 'AZAD_KASHMIR',
        'client_branch_id' => '00001',
        'client_session_id' => 'a18b-fe2e-4a6d-8ab7-658ab',
        'client_machine_identifier' => 'HO-IT-Marchal',
        'client_timestamp' => '2026-05-07T09:32:12.8620554Z',
        'longitude' => '33.70',
        'latitude' => '73.41',
    ]);

    $this->actingAs($admin)
        ->post(route('nadra-verifications.call-api', $record))
        ->assertRedirect(route('nadra-verifications.show', $record));

    Http::assertSent(function (ClientRequest $request): bool {
        return $request->url() === 'https://stagendel.nadra.gov.pk/mbvs/v1/mbvsstandard/verifymbvs'
            && $request->hasHeader('X-IBM-Client-Id', 'client-id')
            && $request->hasHeader('Content-Type', 'application/json')
            && $request->hasHeader('Accept', 'text/plain')
            && $request->hasHeader('Authorization', 'test-access-token')
            && $request['franchiseeId'] === '6820'
            && $request['sessionId'] === null
            && $request['transactionId'] === '6820778146332862003'
            && $request['citizenNumber'] === '8224343808313'
            && $request['citizenContactNumber'] === '03008169924'
            && $request['fingerIndex'] === 'RIGHT_THUMB'
            && $request['templateType'] === 'RAW_IMAGE'
            && $request['fingerTemplate'] === 'finger-template-base64'
            && $request['areaName'] === 'azad_kashmir'
            && $request['clientBranchId'] === '00001'
            && $request['clientSessionId'] === 'a18b-fe2e-4a6d-8ab7-658ab'
            && $request['clientMachineIdentifier'] === 'HO-IT-Marchal'
            && $request['clientTimestamp'] === '2026-05-07T09:32:12.8620554Z'
            && is_string($request['longitude'])
            && is_string($request['latitude'])
            && $request['photograph'] === 'photograph-base64';
    });

    $record->refresh();

    expect($record->response_code)->toBe('100')
        ->and($record->is_successful)->toBeTrue()
        ->and($record->raw_request['clientTimestamp'])->toBe('2026-05-07T09:32:12.8620554Z')
        ->and($record->raw_request)->not->toHaveKey('clientTimeStamp');
});

// --- CRUD delete ---

test('admin with delete permission can delete a record', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $admin->givePermissionTo('nadra-verification.delete');

    $record = NadraVerification::factory()->create();

    $this->actingAs($admin)
        ->delete(route('nadra-verifications.destroy', $record))
        ->assertRedirect(route('nadra-verifications.index'));

    $this->assertDatabaseMissing('nadra_verifications', ['id' => $record->id]);
});

test('admin without delete permission cannot delete a record', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $record = NadraVerification::factory()->create();

    $this->actingAs($admin)
        ->delete(route('nadra-verifications.destroy', $record))
        ->assertForbidden();

    $this->assertDatabaseHas('nadra_verifications', ['id' => $record->id]);
});

// --- Filters ---

test('citizen number filter returns expected records', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    NadraVerification::factory()->create(['citizen_number' => '6110119876547']);
    NadraVerification::factory()->create(['citizen_number' => '3520112345678']);

    $this->actingAs($admin)
        ->get('/nadra-verifications?filter[citizen_number]=6110')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('nadra-verifications/index')
            ->has('verifications.data', 1)
            ->where('verifications.data.0.citizen_number', '6110119876547'),
        );
});

test('area name filter returns expected records', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    NadraVerification::factory()->create(['area_name' => 'PUNJAB']);
    NadraVerification::factory()->create(['area_name' => 'SINDH']);

    $this->actingAs($admin)
        ->get('/nadra-verifications?filter[area_name]=PUNJAB')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('nadra-verifications/index')
            ->has('verifications.data', 1)
            ->where('verifications.data.0.area_name', 'PUNJAB'),
        );
});

test('disallowed filter key is rejected', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get('/nadra-verifications?filter[random_field]=value')
        ->assertStatus(400);
});

// --- Seeder ---

test('nadra enumerations seeder seeds all enumeration tables', function (): void {
    $this->seed(NadraEnumerationsSeeder::class);

    $this->assertDatabaseCount('nadra_area_names', 8);
    $this->assertDatabaseCount('nadra_finger_indexes', 10);
    $this->assertDatabaseCount('nadra_template_types', 7);
    $this->assertDatabaseCount('nadra_response_codes', 37);
});

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nadra_area_names', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('nadra_finger_indexes', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('nadra_template_types', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('nadra_response_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('message');
            $table->timestamps();
        });

        Schema::create('nadra_verifications', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_id', 19)->nullable();
            $table->string('citizen_number', 13);
            $table->string('citizen_contact_number', 16)->nullable();
            $table->string('finger_index')->nullable();
            $table->string('template_type')->nullable();
            $table->longText('finger_template')->nullable();
            $table->longText('photograph')->nullable();
            $table->string('transaction_id', 19);
            $table->string('area_name', 32);
            $table->string('client_branch_id');
            $table->string('client_machine_identifier', 64);
            $table->string('client_session_id', 64);
            $table->string('client_timestamp', 64);
            $table->decimal('latitude', 10, 6);
            $table->decimal('longitude', 10, 6);
            $table->string('response_code')->nullable();
            $table->text('response_message')->nullable();
            $table->string('facial_result')->nullable();
            $table->string('fingerprint_result')->nullable();
            $table->json('citizen_data')->nullable();
            $table->json('available_fingers')->nullable();
            $table->json('raw_request')->nullable();
            $table->json('raw_response')->nullable();
            $table->boolean('is_successful')->default(false);
            $table->timestamps();

            $table->index('citizen_number');
            $table->index('session_id');
            $table->index('transaction_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nadra_verifications');
        Schema::dropIfExists('nadra_response_codes');
        Schema::dropIfExists('nadra_template_types');
        Schema::dropIfExists('nadra_finger_indexes');
        Schema::dropIfExists('nadra_area_names');
    }
};

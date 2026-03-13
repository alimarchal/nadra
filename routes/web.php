<?php

use App\Http\Controllers\NadraVerifications\NadraVerificationController;
use App\Http\Controllers\Users\UserController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::middleware('permission:user.view|user.create|user.update|user.delete')
        ->group(function (): void {
            Route::resource('users', UserController::class)->except(['show']);
        });

    Route::middleware('permission:nadra-verification.view|nadra-verification.create|nadra-verification.update|nadra-verification.delete')
        ->group(function (): void {
            Route::resource('nadra-verifications', NadraVerificationController::class);
            Route::get('nadra-verifications/{nadra_verification}/download-pdf', [NadraVerificationController::class, 'downloadPdf'])
                ->name('nadra-verifications.download-pdf');
            Route::post('nadra-verifications/{nadra_verification}/call-api', [NadraVerificationController::class, 'callApi'])
                ->name('nadra-verifications.call-api')
                ->middleware('permission:nadra-verification.call-api');
            Route::post('nadra-verifications/{nadra_verification}/last-result', [NadraVerificationController::class, 'getLastResult'])
                ->name('nadra-verifications.last-result')
                ->middleware('permission:nadra-verification.call-api');
        });
});

require __DIR__.'/settings.php';

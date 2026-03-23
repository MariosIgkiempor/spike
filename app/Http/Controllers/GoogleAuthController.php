<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to Google’s OAuth page.
     */
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback from Google.
     */
    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            return redirect('/')->with('error', 'Google authentication failed.');
        }

        // find or login the user
        // if the user doesn't exist, create a new one with the name, email, and avatar from Google
        // if it already exists, update the avatar (leave the name and email unchanged)
        $user = User::firstWhere(['email' => $googleUser->email]) ?? User::create([
            'name' => $googleUser->name,
            'email' => $googleUser->email,
            'email_verified_at' => now(),
        ]);

        $user->update([
            'avatar_url' => $googleUser->getAvatar(),
        ]);

        Auth::login($user);

        return redirect('/dashboard');
    }
}

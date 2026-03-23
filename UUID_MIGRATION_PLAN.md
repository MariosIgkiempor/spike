# Production UUID Migration — Laravel Forge Execution Plan

## Pre-requisites

- Production uses **MySQL**, **database sessions**, **database cache**, **database queue**
- The migration converts all integer PKs to UUID v7 — this is a **breaking schema change**
- Schedule during **low-traffic hours** (users will see a maintenance page)

---

## Phase 1: Preparation (before deploy day)

### 1. Verify the migration locally against MySQL

Run the migration against a local MySQL database to confirm the MySQL path works:

```bash
# Set DB_CONNECTION=mysql in .env temporarily, point to a local MySQL
php artisan migrate:fresh   # creates UUID schema from updated migrations
php artisan migrate:fresh --seed  # verify seeder still works
```

Then test the data-migration path (integer → UUID) by reverting the original migrations:

```bash
# Revert the existing migration changes on a temp branch, run migrate,
# then re-apply and run the UUID migration to confirm the conversion path
```

### 2. Merge to your deploy branch

Push the UUID changes to the branch Forge deploys from (e.g., `main`). Do **NOT** let Forge auto-deploy yet — disable auto-deploy in Forge if it's enabled.

### 3. Update your Forge deploy script

In Forge → Site → Deploy Script, temporarily add maintenance mode and remove `php artisan migrate --force` if it's there. You'll run the migration manually. The deploy script should look like:

```bash
cd /home/forge/your-site.com

git pull origin main

composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

npm ci
npm run build

# Do NOT run migrate here — we'll do it manually
# php artisan migrate --force

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

---

## Phase 2: Execution (maintenance window)

### 4. SSH into the Forge server

```bash
ssh forge@your-server-ip
cd /home/forge/your-site.com
```

### 5. Back up the MySQL database

```bash
mysqldump -u forge -p your_database_name > ~/db-backup-pre-uuid-$(date +%Y%m%d-%H%M%S).sql
```

Verify the backup:
```bash
ls -lh ~/db-backup-pre-uuid-*.sql
```

### 6. Enable maintenance mode

```bash
php artisan down --secret="your-secret-token"
```

This shows a 503 page to all users. You can bypass it by visiting `your-site.com/your-secret-token` to verify things after migration.

### 7. Stop queue workers

In Forge → Site → Queue, pause or stop any active queue workers. Or via CLI:

```bash
php artisan queue:restart
```

This tells workers to exit after their current job finishes. Wait a few seconds for them to stop.

### 8. Deploy the code

Trigger the deploy from Forge UI (click "Deploy Now"), or run manually:

```bash
git pull origin main
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
npm ci && npm run build
```

### 9. Run the migration

```bash
php artisan migrate --force
```

This runs the UUID conversion migration. For a small-to-medium database it should complete in seconds. Watch the output for errors.

If it **fails**: restore from backup immediately:

```bash
mysql -u forge -p your_database_name < ~/db-backup-pre-uuid-*.sql
```

Then bring the site back up with `php artisan up` and investigate.

### 10. Verify the migration worked

```bash
php artisan tinker
```

```php
>>> App\Models\User::first()->id
// Should return a UUID string like "019d1c4b-9a08-721c-82fd-da1180e1bce8"

>>> App\Models\League::first()->id
// Should also return a UUID string

>>> App\Models\Game::first()?->id
// UUID string
```

### 11. Clear caches

Database cache and sessions reference old integer IDs. Flush them:

```bash
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

The `cache:clear` wipes the database cache store. All active sessions will be invalidated (users will need to log in again — this is expected since `sessions.user_id` changed).

### 12. Restart queue workers

In Forge → Site → Queue, restart your queue workers. Or:

```bash
php artisan queue:restart
```

### 13. Smoke test behind the maintenance screen

Visit `your-site.com/your-secret-token` to bypass maintenance mode, then:

- Log in
- View a league page (verify leaderboard loads, head-to-head works)
- Create a test game (verify player selection, form submission)
- Check that URLs contain UUIDs (e.g., `/leagues/019d1c...`)
- Check browser console for JS errors

### 14. Bring the site back up

```bash
php artisan up
```

### 15. Re-enable auto-deploy (if applicable)

In Forge → Site → Deploy Script, add `php artisan migrate --force` back to the deploy script if you had it there before. Re-enable auto-deploy if desired.

---

## Phase 3: Post-migration

### 16. Monitor for errors

Watch your logs for the next hour:

```bash
tail -f storage/logs/laravel.log
```

Or check Nightwatch/your error tracking service.

### 17. Keep the backup

Keep `~/db-backup-pre-uuid-*.sql` on the server for at least a week. After you're confident everything works, clean it up:

```bash
rm ~/db-backup-pre-uuid-*.sql
```

---

## Rollback procedure (if needed after going live)

If you discover a critical issue after bringing the site up:

```bash
php artisan down --secret="emergency-token"
php artisan queue:restart

# Revert git to previous commit
git checkout HEAD~1 -- .
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
npm ci && npm run build

# Restore database
mysql -u forge -p your_database_name < ~/db-backup-pre-uuid-*.sql

php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

php artisan up
```

---

## Timeline estimate

| Step | Duration |
|------|----------|
| Backup database | ~30 seconds |
| Maintenance mode + stop workers | ~10 seconds |
| Deploy code | ~1-2 minutes |
| Run migration | ~5-30 seconds (depends on data size) |
| Clear caches + restart workers | ~10 seconds |
| Smoke test | ~2-3 minutes |
| **Total downtime** | **~5-7 minutes** |

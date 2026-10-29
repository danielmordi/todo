<?php

namespace Database\Seeders;

use App\Enums\ProjectStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'demo@example.com'],
            [
                'name' => 'Alex Morgan',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        $tz = config('app.timezone', 'UTC');
        $today = CarbonImmutable::now($tz);

        // Client 1
        $client1 = Client::create([
            'user_id' => $user->id,
            'name' => 'Acme Corporation',
            'email' => 'billing@acme.com',
            'notes' => 'Fast-growing retail client with high feature velocity.',
        ]);

        // Client 2
        $client2 = Client::create([
            'user_id' => $user->id,
            'name' => 'Starlight Media Group',
            'email' => 'tech@starlightmedia.com',
            'notes' => 'Digital media and publishing network. Weekly review on Tuesdays.',
        ]);

        // Client 3
        $client3 = Client::create([
            'user_id' => $user->id,
            'name' => 'Apex Health Solutions',
            'email' => 'ops@apexhealth.io',
            'notes' => 'HIPAA compliance and clinical workflows.',
        ]);

        // Project 1 (Client 1)
        $p1 = Project::create([
            'client_id' => $client1->id,
            'name' => 'Online Storefront Redesign',
            'status' => ProjectStatus::Active,
            'deadline' => $today->addDays(20)->toDateString(),
            'budget_hours' => 60.00,
        ]);

        // Project 2 (Client 1)
        $p2 = Project::create([
            'client_id' => $client1->id,
            'name' => 'Checkout Microservice Integration',
            'status' => ProjectStatus::Active,
            'deadline' => $today->addDays(10)->toDateString(),
            'budget_hours' => 35.00,
        ]);

        // Project 3 (Client 2)
        $p3 = Project::create([
            'client_id' => $client2->id,
            'name' => 'Subscriber Portal Migration',
            'status' => ProjectStatus::Active,
            'deadline' => $today->addDays(14)->toDateString(),
            'budget_hours' => 45.00,
        ]);

        // Project 4 (Client 2)
        $p4 = Project::create([
            'client_id' => $client2->id,
            'name' => 'Brand Styleguide & UI System',
            'status' => ProjectStatus::Completed,
            'deadline' => $today->subDays(5)->toDateString(),
            'budget_hours' => 25.00,
        ]);

        // Project 5 (Client 3)
        $p5 = Project::create([
            'client_id' => $client3->id,
            'name' => 'Patient Intake Web App',
            'status' => ProjectStatus::OnHold,
            'deadline' => $today->addDays(45)->toDateString(),
            'budget_hours' => 80.00,
        ]);

        // 20 Tasks
        $tasksData = [
            // P1 tasks (Acme Storefront) - 5 tasks
            [
                'project_id' => $p1->id,
                'title' => 'Fix cart drawer responsiveness on Safari iOS',
                'description' => 'Viewport calculation triggers horizontal overflow during checkout transition.',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::High,
                'due_date' => $today->toDateString(),
                'estimated_hours' => 3.50,
            ],
            [
                'project_id' => $p1->id,
                'title' => 'Audit hero typography and LCP score',
                'description' => 'Font loading is causing FOIT and 450ms layout shift on 3G.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::Medium,
                'due_date' => $today->subDays(3)->toDateString(),
                'estimated_hours' => 4.00,
            ],
            [
                'project_id' => $p1->id,
                'title' => 'Wire product catalog facet filters',
                'description' => 'Connect category, price, and color filters to query string params.',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::High,
                'due_date' => $today->addDays(4)->toDateString(),
                'estimated_hours' => 6.00,
            ],
            [
                'project_id' => $p1->id,
                'title' => 'Implement multi-currency switcher dropdown',
                'description' => 'Add USD, EUR, GBP rates cached for 1 hour.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::Low,
                'due_date' => $today->addDays(12)->toDateString(),
                'estimated_hours' => 2.50,
            ],
            [
                'project_id' => $p1->id,
                'title' => 'Set up initial Tailwind 4 theme tokens',
                'description' => 'Color palette and font family configuration verified against brand kit.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::Medium,
                'due_date' => $today->subDays(7)->toDateString(),
                'estimated_hours' => 5.00,
            ],

            // P2 tasks (Acme Checkout) - 4 tasks
            [
                'project_id' => $p2->id,
                'title' => 'Implement Stripe payment intent verification webhook',
                'description' => 'Verify HMAC signature and persist event status to database.',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::High,
                'due_date' => $today->toDateString(),
                'estimated_hours' => 5.00,
            ],
            [
                'project_id' => $p2->id,
                'title' => 'Write end-to-end checkout failure fallback handler',
                'description' => 'Display user-friendly recovery instructions when 3D Secure fails.',
                'status' => TaskStatus::Blocked,
                'priority' => TaskPriority::High,
                'due_date' => $today->subDays(2)->toDateString(),
                'estimated_hours' => 4.00,
            ],
            [
                'project_id' => $p2->id,
                'title' => 'Clean address validation API error feedback',
                'description' => 'Handle postal code formatting differences between US and CA.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::Medium,
                'due_date' => $today->addDays(6)->toDateString(),
                'estimated_hours' => 3.00,
            ],
            [
                'project_id' => $p2->id,
                'title' => 'Setup tax calculator integration sandbox',
                'description' => 'Test Avalara sandbox sandbox credentials.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::Low,
                'due_date' => $today->subDays(10)->toDateString(),
                'estimated_hours' => 4.00,
            ],

            // P3 tasks (Starlight Portal) - 4 tasks
            [
                'project_id' => $p3->id,
                'title' => 'Migrate customer session store to Redis cluster',
                'description' => 'Configure connection pooling and graceful reconnection strategy.',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::High,
                'due_date' => $today->addDays(2)->toDateString(),
                'estimated_hours' => 7.00,
            ],
            [
                'project_id' => $p3->id,
                'title' => 'Build customer invoice PDF download endpoint',
                'description' => 'Stream server-rendered PDF receipt with company header.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::Medium,
                'due_date' => $today->toDateString(),
                'estimated_hours' => 4.50,
            ],
            [
                'project_id' => $p3->id,
                'title' => 'Fix SSO token expiry redirect loop',
                'description' => 'Clear stale bearer token cookie when OAuth refresh fails.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::High,
                'due_date' => $today->subDays(4)->toDateString(),
                'estimated_hours' => 3.00,
            ],
            [
                'project_id' => $p3->id,
                'title' => 'Write migration script for legacy user passwords',
                'description' => 'Migrate SHA-256 legacy hashes into Bcrypt on next login.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::Medium,
                'due_date' => $today->subDays(8)->toDateString(),
                'estimated_hours' => 6.00,
            ],

            // P4 tasks (Starlight Styleguide) - 3 tasks
            [
                'project_id' => $p4->id,
                'title' => 'Export color and typography tokens to Figma sync',
                'description' => 'Generate JSON token definitions for brand design team.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::Low,
                'due_date' => $today->subDays(12)->toDateString(),
                'estimated_hours' => 4.00,
            ],
            [
                'project_id' => $p4->id,
                'title' => 'Build interactive button variant documentation',
                'description' => 'Storybook documentation for primary, outline, and destructive button states.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::Low,
                'due_date' => $today->subDays(9)->toDateString(),
                'estimated_hours' => 3.50,
            ],
            [
                'project_id' => $p4->id,
                'title' => 'Audit color contrast ratios for dark mode palettes',
                'description' => 'Ensure WCAG AA 4.5:1 ratio across muted foreground tokens.',
                'status' => TaskStatus::Done,
                'priority' => TaskPriority::Medium,
                'due_date' => $today->subDays(6)->toDateString(),
                'estimated_hours' => 2.00,
            ],

            // P5 tasks (Apex Health) - 4 tasks
            [
                'project_id' => $p5->id,
                'title' => 'Design multi-step medical history questionnaire UI',
                'description' => 'Keep step state local with auto-saving drafts in session storage.',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::Medium,
                'due_date' => $today->addDays(15)->toDateString(),
                'estimated_hours' => 8.00,
            ],
            [
                'project_id' => $p5->id,
                'title' => 'Implement digital signature canvas for consent forms',
                'description' => 'Capture vector curve coordinates and render PNG preview.',
                'status' => TaskStatus::Blocked,
                'priority' => TaskPriority::Medium,
                'due_date' => $today->addDays(20)->toDateString(),
                'estimated_hours' => 5.00,
            ],
            [
                'project_id' => $p5->id,
                'title' => 'Set up field-level encryption for insurance policy numbers',
                'description' => 'Use Laravel AES-256 cast for sensitive patient attributes.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::High,
                'due_date' => $today->addDays(30)->toDateString(),
                'estimated_hours' => 6.00,
            ],
            [
                'project_id' => $p5->id,
                'title' => 'Review FHIR API compliance documentation',
                'description' => 'Verify terminology mappings for diagnostic observation resources.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::Low,
                'due_date' => $today->addDays(40)->toDateString(),
                'estimated_hours' => 4.00,
            ],
        ];

        foreach ($tasksData as $data) {
            Task::create($data);
        }
    }
}

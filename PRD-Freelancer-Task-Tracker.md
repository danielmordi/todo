# PRD: Freelancer Task Tracker

**Version:** 0.1 (draft) · **Stack:** Laravel, Inertia, React, TypeScript, Tailwind, shadcn/ui, Wayfinder, SQLite · **Deploy target:** Dokploy

## 1. Summary

A single-user task tracker for freelance web developers who work across several clients at once. Tasks live under Projects, and Projects live under Clients, so the developer can see what is due across all clients on one screen. v1 is deliberately small. It doubles as a test project for the Laravel React starter kit deployment pipeline on Dokploy.

## 2. Problem

Freelancers juggle multiple clients, each with its own deadlines. Generic to-do apps are flat lists. Heavier tools (Linear, Jira, ClickUp) are built for teams and carry setup overhead a solo developer does not want. The pain is the morning question: *what is due today and what is overdue, across every client?*

## 3. Honest positioning

This does not beat Notion, Trello, or Todoist on features. Its only edge is the fixed Client → Project → Task shape with cross-client views, and no setup. If v1 does not feel faster than a Notion database for that one question, the product has no reason to exist beyond being a deployment test. Treat that as the validation bar.

## 4. Target user

A solo freelance web developer with 2 to 10 active clients and 3 to 20 open projects. Technical, comfortable with a minimal UI, no need for collaboration.

## 5. Goals and non-goals

**Goals**

- See today's, overdue, and in-progress tasks across all clients in one place.
- Organize work by client and project with visible progress.
- Deploy and run reliably on Dokploy from a Dockerfile build.

**Non-goals (v1)**

- Time tracking, invoicing, payments
- File uploads, comments, notifications
- Teams, sharing, client portals
- Public API, drag and drop, mobile app, Inertia SSR

## 6. Success metrics

This is a personal tool, so metrics are practical.

- The Dokploy deploy succeeds from a clean push with no manual steps beyond environment variables.
- The owner uses it for real work for two consecutive weeks without reverting to another tool.
- Dashboard loads in under 500 ms with 500 tasks seeded.
- All Pest tests pass, and `npm run build` succeeds in CI and in Docker.

## 7. User stories

1. As a freelancer, I add a client and its projects so my work is grouped the way I bill it.
2. As a freelancer, I see tasks due today and overdue ones on my dashboard so I know what to start with.
3. As a freelancer, I move a task between todo, in progress, blocked, and done so the board reflects reality.
4. As a freelancer, I see a progress bar per project so I can tell a client where things stand.
5. As a freelancer, I filter all tasks by client, project, status, priority, and due date.
6. As a freelancer, I never see another user's data.

## 8. Functional requirements

### 8.1 Clients

- Fields: name (required), email (optional), notes (optional).
- CRUD. Deleting a client requires confirmation and cascades to its projects and tasks.
- Show page lists the client's projects with a progress bar (done tasks / total tasks).

### 8.2 Projects

- Fields: client, name (required), status (active, on\_hold, completed), deadline (optional), budget\_hours (optional, decimal).
- CRUD with the same cascade-and-confirm rule.
- Show page is a board with four columns: todo, in\_progress, blocked, done. Status changes use a dropdown or buttons, not drag and drop.

### 8.3 Tasks

- Fields: project, title (required, max 255), description (optional), status (todo, in\_progress, blocked, done), priority (low, medium, high), due date (optional), estimated hours (optional, decimal), completed\_at (system-managed).
- `completed_at` is set when status becomes done and cleared when it leaves done. This lives in the model layer so every code path behaves the same.
- Creating a task from a project page pre-fills that project.

### 8.4 Dashboard

- Three lists: due today, overdue, in progress. Each item shows task, project, client, and links to the task.

### 8.5 All tasks page

- Filters: client, project, status, priority, due (overdue, today, this week).
- Filters persist in the query string. Paginated, 15 per page.

## 9. Business rules

- **Overdue** means due date is before today and status is not done. Compare dates only, never timestamps, and compute on the server in the user's configured timezone.
- Users can only access their own clients, projects, and tasks. Ownership is checked through the parent chain on every action, including status changes and task creation with a supplied project ID.
- Cascade deletes are real deletes in v1. No soft deletes.

## 10. Data model

| Entity | Key fields | Ownership |
| --- | --- | --- |
| User | starter kit default | n/a |
| Client | user\_id, name, email, notes | direct `user_id` |
| Project | client\_id, name, status, deadline, budget\_hours | via client |
| Task | project\_id, title, description, status, priority, due\_date, estimated\_hours, completed\_at | via project |

Indexes: `tasks(project_id, status)`, `tasks(due_date)`, `projects(client_id)`, `clients(user_id)`.

## 11. Non-functional requirements

- **Security:** policies on all models, Form Request validation, no raw queries, CSRF via Inertia defaults.
- **Performance:** eager loading everywhere. `Model::preventLazyLoading()` enabled outside production to catch N+1.
- **Accessibility:** keyboard-operable status controls and labelled form fields (shadcn defaults).
- **Portability:** SQLite must keep working. No database-specific features, no queues, no external services.

## 12. Deployment requirements (Dokploy)

- Dockerfile build with a multi-stage setup: PHP and Node in the build stage, because the starter kit's Wayfinder step runs `php artisan` during `npm run build`.
- Runtime image listens on port 8080. Domain in Dokploy must target 8080 with HTTPS enabled.
- Required environment variables: `APP_KEY`, `APP_ENV`, `APP_DEBUG`, `APP_URL`, `DB_CONNECTION`, `DB_DATABASE`.
- `trustProxies(at: '*')` configured, since Traefik terminates TLS.
- **SQLite caveat:** data is lost on redeploy unless a volume is mounted at the database directory. Acceptable for the test deploy. Moving to Postgres or MySQL is required before storing real work.

## 13. Acceptance criteria

- Owner can create, edit, and delete clients, projects, and tasks.
- A second user receives 403 on every view, update, and delete of the first user's records, and cannot create a task under the first user's project.
- Marking a task done sets `completed_at`. Moving it back clears it.
- A task due today is not overdue. A done task is never overdue.
- Deleting a client removes its projects and tasks.
- `php artisan test` and `npm run build` pass locally and inside the Docker build.
- The app loads over HTTPS on the Dokploy domain with working login and a working task flow.

## 14. Milestones

1. **M1:** Migrations, models, factories, policies, seeders.
2. **M2:** Clients and projects CRUD with progress bars.
3. **M3:** Tasks CRUD, project board, status transitions.
4. **M4:** Dashboard lists and All tasks filters.
5. **M5:** Pest test suite, Dockerfile, Dokploy deploy.

## 15. Risks and open questions

| Risk or question | Impact | Mitigation or decision needed |
| --- | --- | --- |
| Weak differentiation from existing tools | No reason to keep using it | Use it for real work for two weeks, then decide whether to continue |
| Ownership checks through the parent chain are easy to miss | Data leak between users | Dedicated tests for cross-user task creation and updates |
| SQLite data loss on redeploy | Lost tasks | Volume mount, or Postgres before real use |
| Wayfinder build step fails in Docker | Deploy blocked | Build assets in a stage with PHP, Composer, and Node |
| Sessions and cache on the database driver | Logout on redeploy when SQLite is unmounted | Mount a volume or switch drivers |
| Will this become a product other freelancers use? | Changes the data model | If yes, decide on multi-tenancy, billing, and client access now. Retrofitting them later is costly |

## 16. Future (explicitly not v1)

Time tracking per task, invoice export from tracked hours, client-facing read-only status page, recurring tasks, email reminders, drag and drop board.

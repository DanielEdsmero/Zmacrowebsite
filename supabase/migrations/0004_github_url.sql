-- Add optional GitHub repository URL to macros
alter table macros add column if not exists github_url text;

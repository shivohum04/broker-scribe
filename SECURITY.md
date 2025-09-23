# Security Guidelines

## Environment Variables

This project uses environment variables for sensitive configuration. **Never commit `.env` files to version control.**

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
```

### Security Best Practices

1. **Never commit sensitive data** to version control
2. **Use environment variables** for all configuration
3. **Rotate credentials** if they are accidentally exposed
4. **Use different credentials** for development and production
5. **Review all commits** before pushing to ensure no secrets are included

### If You Accidentally Commit Secrets

1. **Immediately rotate the exposed credentials**
2. **Remove the secrets from git history** using `git filter-branch` or BFG Repo-Cleaner
3. **Force push** the cleaned history to remote repository
4. **Notify team members** to re-clone the repository

### File Security

- `.env` files are ignored by git
- Supabase temp files are ignored
- OS-generated files are ignored
- IDE files are ignored

## Reporting Security Issues

If you discover a security vulnerability, please report it privately to the project maintainers.

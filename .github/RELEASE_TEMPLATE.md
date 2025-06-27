# Release Template

## Manual Release Process

### Prerequisites
- [ ] All features are complete and tested
- [ ] Code is on `main` branch
- [ ] Working directory is clean (no uncommitted changes)
- [ ] All tests pass (if available)

### Release Steps

#### Option 1: Using GitHub Actions (Recommended)
1. **Automatic Release (commit-based)**:
   - Include `[release]` in your commit message
   - Or commit with `feat:` or `fix:` prefix
   - Push to `main` branch
   - GitHub Actions will automatically create a release

2. **Manual Release (workflow dispatch)**:
   - Go to Actions tab in GitHub
   - Select "Release Chrome Extension" workflow
   - Click "Run workflow"
   - Choose version bump type (patch/minor/major)
   - Click "Run workflow"

#### Option 2: Using Release Script
```bash
# For patch version (1.0.0 → 1.0.1)
./scripts/release.sh patch

# For minor version (1.0.0 → 1.1.0)
./scripts/release.sh minor

# For major version (1.0.0 → 2.0.0)
./scripts/release.sh major
```

#### Option 3: Manual Process
1. **Update version**:
   ```bash
   npm version [patch|minor|major] --no-git-tag-version
   ```

2. **Build and package**:
   ```bash
   npm run build
   npm run package
   ```

3. **Commit and tag**:
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: bump version to vX.X.X"
   git tag -a "vX.X.X" -m "Release vX.X.X"
   git push origin main
   git push origin vX.X.X
   ```

4. **Create GitHub release**:
   - Go to GitHub releases page
   - Click "Create a new release"
   - Select the created tag
   - Upload the built extension package
   - Add release notes

## Version Bumping Strategy

### Semantic Versioning
- **MAJOR** (X.0.0): Breaking changes, incompatible API changes
- **MINOR** (x.Y.0): New features, backward compatible
- **PATCH** (x.y.Z): Bug fixes, backward compatible

### Commit Message Guidelines
- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `feat!:` or `BREAKING CHANGE:` → Major version bump
- `[release]` in commit message → Triggers automatic release

## Release Checklist

### Pre-Release
- [ ] Feature complete and tested
- [ ] No TypeScript errors
- [ ] Extension loads properly in Chrome
- [ ] All functionality works as expected
- [ ] No console errors
- [ ] Documentation updated

### During Release
- [ ] Version bumped correctly
- [ ] Build successful
- [ ] Package created
- [ ] Git tag created
- [ ] GitHub release created
- [ ] Extension package uploaded

### Post-Release
- [ ] Verify GitHub release is public
- [ ] Test downloaded package
- [ ] Update documentation if needed
- [ ] Announce release (if applicable)
- [ ] Consider Chrome Web Store submission

## Troubleshooting

### Common Issues
1. **Build fails**: Check for TypeScript errors, missing dependencies
2. **Package not found**: Ensure `npm run build` and `npm run package` complete successfully
3. **Git tag exists**: Delete existing tag with `git tag -d vX.X.X` and `git push origin :refs/tags/vX.X.X`
4. **GitHub release fails**: Check repository permissions and GitHub token

### Debug Commands
```bash
# Check current version
node -p "require('./package.json').version"

# List recent tags
git tag -l --sort=-version:refname | head -5

# Check build output
ls -la build/

# Verify package
file build/*.zip
```

## Chrome Web Store Submission

### Preparation
1. Ensure extension follows Chrome Web Store policy
2. Prepare store listing materials:
   - Screenshots (1280x800)
   - Icon (128x128)
   - Description (Japanese/English)
   - Privacy policy (if applicable)

### Submission Process
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Upload the packaged extension
3. Fill in store listing details
4. Submit for review

### Review Timeline
- Typically 1-3 business days
- May take longer for new extensions
- Address any review feedback promptly
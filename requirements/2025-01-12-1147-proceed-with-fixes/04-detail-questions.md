# Expert Detail Questions

Based on deep codebase analysis, I need clarification on specific implementation decisions for fixing the blocking issues.

## Q6: Should we update image paths to use the existing /Images/ structure or normalize to lowercase /images/?
**Default if unknown:** Update paths to match existing /Images/ structure (faster, maintains current organization)

## Q7: For the splash screen logo, should we use /Images/PNG/logo.png or create a new organized path?
**Default if unknown:** Use /Images/PNG/logo.png (already exists and is properly sized)

## Q8: Should we implement the full auth flow from auth-guide.md now or create placeholder routes?
**Default if unknown:** Create placeholder routes for now (unblocks navigation, auth can be fully implemented later)

## Q9: After fixing image paths, should we test the complete onboarding flow before moving to other issues?
**Default if unknown:** Yes (validates that the core user journey works end-to-end)

## Q10: Should we preserve the existing component architecture or refactor image handling?
**Default if unknown:** Preserve existing architecture (components are well-structured, just need path corrections)
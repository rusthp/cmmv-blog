# Image Fallback Pipeline Specification

## ADDED Requirements

### Requirement: External Image Validation
The system SHALL validate external image URLs using domain whitelists and HEAD requests before resolving them.

#### Scenario: Valid trusted domain
Given an image URL from a trusted domain
When the system resolves the image
Then it MUST return the external URL and cache it locally

#### Scenario: Invalid or failing external image
Given an image URL that returns a 403 or 404
When the system validates the image
Then it MUST fallback to the local cache or placeholder

### Requirement: Local Image Cache
The system SHALL cache successfully validated images locally to prevent future failures.

#### Scenario: Original image becomes unavailable
Given an external image URL that was previously cached but now fails
When the system tries to resolve the image
Then it MUST use the version from the local cache

### Requirement: Automatic Image Placeholder
The system SHALL generate an automatic placeholder when no valid image or cache is available.

#### Scenario: No image available
Given a post with no valid image and no cached version
When the system resolves the image
Then it MUST return a dynamically generated placeholder based on the post title

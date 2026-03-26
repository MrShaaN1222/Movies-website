# MongoDB Schema Summary

- `users`: identity, role, watchlist, favorites, subscription plan.
- `movies`: metadata, cast/crew, ratings, trailers, providers.
- `reviews`: movie/user rating and comments.
- `freevideos`: legal free movie entries (YouTube/public domain).
- `ottcontents`: premium content catalog and HLS metadata.
- `watchprogresses`: continue-watching across devices.
- `affiliateclicks`: tracked provider redirects.
- `adevents`: ad impression/click/video analytics events.
- `subscriptions`: Razorpay-linked subscription state.

## Indexes

- Text search index on `movies` title/overview/genres.
- Slug indexes for movie and OTT detail lookups.
- Compound uniqueness for watch progress (`userId`, `ottContentId`).

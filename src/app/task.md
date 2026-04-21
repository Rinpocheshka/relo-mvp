- [x] Add `status` column to `events` table (default 'pending')
- [x] Set existing `events` to `active`
- [x] Update `Events.tsx` to retrieve only `active` status events
- [x] Update `EventFormModal.tsx` to pass `status: 'pending'` and show 'sent to moderation' toast
- [x] Update `Layout.tsx` to fetch pending count for both announcements and events
- [x] Refactor `AnnouncementModerationPage.tsx` into a unified `ModerationPage.tsx` with tabs
- [x] Build and verify

### Stories Moderation
- [ ] Add `status` column to `stories` table (default 'pending')
- [ ] Set existing `stories` to `active`
- [ ] Update `StoriesPage.tsx` to retrieve only `active` status stories
- [ ] Update `WriteStoryModal.tsx` to pass `status: 'pending'` and show 'sent to moderation' toast
- [ ] Update `Layout.tsx` to fetch pending count for `announcements`, `events`, and `stories`
- [ ] Update `AnnouncementModerationPage.tsx` to handle the `stories` collection
- [ ] Build and verify

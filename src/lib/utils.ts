import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { NonNullablePaths } from '@wix/sdk-types';
export interface Member {
    /**
     * Member ID.
     * @format GUID
     * @readonly
     */
    _id?: string | null;
    /**
     * Email used by a member to log in to the site.
     * @format EMAIL
     */
    loginEmail?: string | null;
    /**
     * Whether the email used by a member has been verified.
     * @readonly
     */
    loginEmailVerified?: boolean | null;
    /**
     * Member site access status.
     * @readonly
     */
    status?: Status;
    /**
     * Contact ID.
     * @format GUID
     * @readonly
     */
    contactId?: string | null;
    /**
     * Member's contact information. Contact information is stored in the
     * [Contact List](https://www.wix.com/my-account/site-selector/?buttonText=Select%20Site&title=Select%20a%20Site&autoSelectOnSingleSite=true&actionUrl=https:%2F%2Fwww.wix.com%2Fdashboard%2F%7B%7BmetaSiteId%7D%7D%2Fcontacts).
     *
     * The full set of contact data can be accessed and managed with the
     * Contacts API ([SDK](https://dev.wix.com/docs/sdk/backend-modules/crm/contacts/introduction) | [REST](https://dev.wix.com/docs/rest/crm/members-contacts/contacts/contacts/introduction)).
     */
    contact?: Contact;
    /** Profile display details. */
    profile?: Profile;
    /** Member privacy status. */
    privacyStatus?: PrivacyStatusStatus;
    /**
     * Member activity status.
     * @readonly
     */
    activityStatus?: ActivityStatusStatus;
    /**
     * Date and time when the member was created.
     * @readonly
     */
    _createdDate?: Date | null;
    /**
     * Date and time when the member was updated.
     * @readonly
     */
    _updatedDate?: Date | null;
    /**
     * Date and time when the member last logged in to the site.
     * @readonly
     */
    lastLoginDate?: Date | null;
}
export declare enum Status {
    /** Insufficient permissions to get the status. */
    UNKNOWN = "UNKNOWN",
    /** Member is created and is waiting for approval by a Wix user. */
    PENDING = "PENDING",
    /** Member can log in to the site. */
    APPROVED = "APPROVED",
    /** Member is blocked and can't log in to the site. */
    BLOCKED = "BLOCKED",
    /** Member is a [guest author](https://support.wix.com/en/article/wix-blog-adding-managed-writers-to-your-blog) for the site blog and can't log in to the site. */
    OFFLINE = "OFFLINE"
}
/** Contact info associated with the member. */
export interface Contact {
    /** Contact's first name. */
    firstName?: string | null;
    /** Contact's last name. */
    lastName?: string | null;
    /** List of phone numbers. */
    phones?: string[] | null;
    /**
     * List of email addresses.
     * @format EMAIL
     */
    emails?: string[] | null;
    /** List of street addresses. */
    addresses?: Address[];
    /**
     * Contact's birthdate, formatted as `"YYYY-MM-DD"`.
     *
     * Example: `"2020-03-15"` for March 15, 2020.
     * @maxLength 100
     */
    birthdate?: string | null;
    /**
     * Contact's company name.
     * @maxLength 100
     */
    company?: string | null;
    /**
     * Contact's job title.
     * @maxLength 100
     */
    jobTitle?: string | null;
    /**
     * Custom fields are structured as key:value pairs where each key is the field `name`, and each value is the field's `value` for the member.
     *
     * > **Notes:**
     * > - Only custom fields added to the member profile in the dashboard are available through the Members API. Empty fields are not returned.
     * > - When updating a member, `name` is ignored.
     */
    customFields?: Record<string, CustomField>;
}
/** Street address. */
export interface Address extends AddressStreetOneOf {
    /** Street address object, with number and name in separate fields. */
    streetAddress?: StreetAddress;
    /**
     * Main address line, usually street and number, as free text.
     * @maxLength 200
     */
    addressLine?: string | null;
    /**
     * Street address ID.
     * @format GUID
     * @readonly
     */
    _id?: string | null;
    /**
     * Free text providing more detailed address information,
     * such as apartment, suite, or floor.
     */
    addressLine2?: string | null;
    /** City name. */
    city?: string | null;
    /**
     * Code for a subdivision (such as state, prefecture, or province) in an
     * [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) format.
     */
    subdivision?: string | null;
    /**
     * 2-letter country code in an
     * [ISO-3166 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) format.
     */
    country?: string | null;
    /** Postal code. */
    postalCode?: string | null;
}
/** @oneof */
export interface AddressStreetOneOf {
    /** Street address object, with number and name in separate fields. */
    streetAddress?: StreetAddress;
    /**
     * Main address line, usually street and number, as free text.
     * @maxLength 200
     */
    addressLine?: string | null;
}
export interface StreetAddress {
    /**
     * Street number.
     * @maxLength 100
     */
    number?: string;
    /**
     * Street name.
     * @maxLength 200
     */
    name?: string;
}
export interface CustomField {
    /** Custom field name. */
    name?: string | null;
    /** Custom field value. */
    value?: any;
}
/** Member Profile */
export interface Profile {
    /**
     * Name that identifies the member to other members.
     * Displayed on the member's profile page
     * and interactions in the forum or blog.
     */
    nickname?: string | null;
    /**
     * Slug that determines the member's profile page URL.
     * @readonly
     */
    slug?: string | null;
    /** Member's profile photo. */
    photo?: Image;
    /**
     * Member's cover photo,
     * used as a background picture in a member's profile page.
     *
     * Cover positioning can be altered with `cover.offsetX` and `cover.offsetY`.
     * When left empty, the values default to `0`.
     */
    cover?: Image;
    /**
     * Member title.
     *
     * Currently available through the API only.
     */
    title?: string | null;
}
export interface Image {
    /**
     * Wix Media image ID,
     * set when the member selects an image from Wix Media.
     */
    _id?: string;
    /** Image URL. */
    url?: string;
    /** Original image width. */
    height?: number;
    /** Original image height. */
    width?: number;
    /**
     * X-axis offset.
     *
     * Default: `0`.
     */
    offsetX?: number | null;
    /**
     * Y-axis offset.
     *
     * Default: `0`.
     */
    offsetY?: number | null;
}
export declare enum PrivacyStatusStatus {
    /** Insufficient permissions to get the status. */
    UNKNOWN = "UNKNOWN",
    /** Member is hidden from site visitors and other site members. Member is returned only to Wix users. */
    PRIVATE = "PRIVATE",
    /** Member is visible to everyone. */
    PUBLIC = "PUBLIC"
}
export declare enum ActivityStatusStatus {
    /** Insufficient permissions to get the status. */
    UNKNOWN = "UNKNOWN",
    /** Member can write forum posts and blog comments. */
    ACTIVE = "ACTIVE",
    /** Member can't write forum posts or blog comments. */
    MUTED = "MUTED"
}
export interface ExtendedFields {
    /**
     * Extended field data. Each key corresponds to the namespace of the app that created the extended fields.
     * The value of each key is structured according to the schema defined when the extended fields were configured.
     *
     * You can only access fields for which you have the appropriate permissions.
     *
     * Learn more about [extended fields](https://dev.wix.com/docs/rest/articles/getting-started/extended-fields).
     */
    namespaces?: Record<string, Record<string, any>>;
}
export interface InvalidateCache extends InvalidateCacheGetByOneOf {
    /**
     * Invalidate by msId. NOT recommended, as this will invalidate the entire site cache!
     * @format GUID
     */
    metaSiteId?: string;
    /**
     * Invalidate by Site ID. NOT recommended, as this will invalidate the entire site cache!
     * @format GUID
     */
    siteId?: string;
    /** Invalidate by App */
    app?: App;
    /** Invalidate by page id */
    page?: Page;
    /** Invalidate by URI path */
    uri?: URI;
    /** Invalidate by file (for media files such as PDFs) */
    file?: File;
    /** Invalidate by custom tag. Tags used in BO invalidation are disabled for this endpoint (more info: https://wix-bo.com/dev/clear-ssr-cache) */
    customTag?: CustomTag;
    /**
     * tell us why you're invalidating the cache. You don't need to add your app name
     * @maxLength 256
     */
    reason?: string | null;
    /** Is local DS */
    localDc?: boolean;
    hardPurge?: boolean;
}
/** @oneof */
export interface InvalidateCacheGetByOneOf {
    /**
     * Invalidate by msId. NOT recommended, as this will invalidate the entire site cache!
     * @format GUID
     */
    metaSiteId?: string;
    /**
     * Invalidate by Site ID. NOT recommended, as this will invalidate the entire site cache!
     * @format GUID
     */
    siteId?: string;
    /** Invalidate by App */
    app?: App;
    /** Invalidate by page id */
    page?: Page;
    /** Invalidate by URI path */
    uri?: URI;
    /** Invalidate by file (for media files such as PDFs) */
    file?: File;
    /** Invalidate by custom tag. Tags used in BO invalidation are disabled for this endpoint (more info: https://wix-bo.com/dev/clear-ssr-cache) */
    customTag?: CustomTag;
}
export interface App {
    /**
     * The AppDefId
     * @minLength 1
     */
    appDefId?: string;
    /**
     * The instance Id
     * @format GUID
     */
    instanceId?: string;
}
export interface Page {
    /**
     * the msid the page is on
     * @format GUID
     */
    metaSiteId?: string;
    /**
     * Invalidate by Page ID
     * @minLength 1
     */
    pageId?: string;
}
export interface URI {
    /**
     * the msid the URI is on
     * @format GUID
     */
    metaSiteId?: string;
    /**
     * URI path to invalidate (e.g. page/my/path) - without leading/trailing slashes
     * @minLength 1
     */
    uriPath?: string;
}
export interface File {
    /**
     * the msid the file is related to
     * @format GUID
     */
    metaSiteId?: string;
    /**
     * Invalidate by filename (for media files such as PDFs)
     * @minLength 1
     * @maxLength 256
     */
    fileName?: string;
}
export interface CustomTag {
    /**
     * the msid the tag is related to
     * @format GUID
     */
    metaSiteId?: string;
    /**
     * Tag to invalidate by
     * @minLength 1
     * @maxLength 256
     */
    tag?: string;
}
export interface UpdateMySlugRequest {
    /**
     * New slug.
     * @maxLength 255
     */
    slug: string;
}
export interface UpdateMySlugResponse {
    /** Updated member. */
    member?: Member;
}
export interface SlugAlreadyExistsPayload {
    slug?: string;
}
export interface UpdateMemberSlugRequest {
    /**
     * Member ID.
     * @format GUID
     */
    _id: string;
    /**
     * New slug.
     * @maxLength 255
     */
    slug: string;
}
export interface UpdateMemberSlugResponse {
    /** Updated member. */
    member?: Member;
}
export interface JoinCommunityRequest {
}
/** Member profile. */
export interface JoinCommunityResponse {
    /** The updated member. */
    member?: Member;
}
export interface MemberJoinedCommunity {
    /**
     * ID of the member who joined the community.
     * @format GUID
     * @readonly
     */
    memberId?: string;
}
export interface LeaveCommunityRequest {
}
/** Member profile. */
export interface LeaveCommunityResponse {
    /** The updated member. */
    member?: Member;
}
export interface MemberLeftCommunity {
    /**
     * ID of the site member who left the community.
     * @format GUID
     * @readonly
     */
    memberId?: string;
}
export interface GetMyMemberRequest {
    /**
     * Predefined set of fields to return.
     *
     * Default: `"PUBLIC"`.
     * @maxSize 3
     */
    fieldsets?: Set[];
}
export declare enum Set {
    /**
     * Includes `id`, `contactId`, `createdDate`, `updatedDate` and the `profile` object.
     * `status`, `privacyStatus`, and `activityStatus` are returned as `UNKNOWN`.
     */
    PUBLIC = "PUBLIC",
    /** Includes `id`, `loginEmail`, `status`, `contactId`, `createdDate`, `updatedDate`, `privacyStatus`, `activityStatus` and the `profile` object. */
    EXTENDED = "EXTENDED",
    /** Includes all fields. */
    FULL = "FULL"
}
/** Member profile. */
export interface GetMyMemberResponse {
    /** The retrieved member. */
    member?: Member;
}
export interface GetMemberRequest {
    /**
     * Member ID.
     * @format GUID
     */
    _id: string;
    /**
     * Predefined set of fields to return.
     *
     * Defaults to `"PUBLIC"`.
     * @maxSize 3
     */
    fieldsets?: Set[];
}
export interface GetMemberResponse {
    /** The requested member. */
    member?: Member;
}
export interface MemberToMemberBlockedPayload {
    /**
     * Member ID.
     * @format GUID
     */
    memberId?: string;
}
export interface ListMembersRequest {
    paging?: Paging;
    /**
     * Predefined sets of fields to return.
     *
     * Default: `"PUBLIC"`.
     * @maxSize 3
     */
    fieldsets?: Set[];
    sorting?: Sorting[];
}
export interface Paging {
    /** Number of items to load. */
    limit?: number | null;
    /** Number of items to skip in the current sort order. */
    offset?: number | null;
}
export interface Sorting {
    /**
     * Name of the field to sort by.
     * @maxLength 512
     */
    fieldName?: string;
    /** Sort order. */
    order?: SortOrder;
}
export declare enum SortOrder {
    ASC = "ASC",
    DESC = "DESC"
}
export interface CursorPaging {
    /**
     * Maximum number of items to return in the results.
     * @max 100
     */
    limit?: number | null;
    /**
     * Pointer to the next or previous page in the list of results.
     *
     * Pass the relevant cursor token from the `pagingMetadata` object in the previous call's response.
     * Not relevant for the first request.
     * @maxLength 16000
     */
    cursor?: string | null;
}
export interface ListMembersResponse {
    /** List of members. */
    members?: Member[];
    /** Metadata for the paginated results. */
    metadata?: PagingMetadata;
}
export interface PagingMetadata {
    /** Number of items returned in the response. */
    count?: number | null;
    /** Offset that was requested. */
    offset?: number | null;
    /** Total number of items that match the query. */
    total?: number | null;
    /** Flag that indicates the server failed to calculate the `total` field. */
    tooManyToCount?: boolean | null;
}
export interface CursorPagingMetadata {
    /** Number of items returned in the response. */
    count?: number | null;
    /** Cursor strings that point to the next page, previous page, or both. */
    cursors?: Cursors;
    /**
     * Whether there are more pages to retrieve following the current page.
     *
     * + `true`: Another page of results can be retrieved.
     * + `false`: This is the last page.
     */
    hasNext?: boolean | null;
}
export interface Cursors {
    /**
     * Cursor string pointing to the next page in the list of results.
     * @maxLength 16000
     */
    next?: string | null;
    /**
     * Cursor pointing to the previous page in the list of results.
     * @maxLength 16000
     */
    prev?: string | null;
}
export interface QueryMembersRequest {
    /** Query options. */
    query?: Query;
    /**
     * Predefined sets of fields to return.
     *
     * Default: `"PUBLIC"`.
     * @maxSize 3
     */
    fieldsets?: Set[];
    /** Plain text search. */
    search?: Search;
}
export interface Query {
    /** Query options. See [API Query Language](https://dev.wix.com/docs/rest/articles/getting-started/api-query-language) for more details. */
    filter?: any;
    /** Limit number of results */
    paging?: Paging;
    /** Sort the results */
    sorting?: Sorting[];
}
/** Free text to match in searchable fields */
export interface Search {
    /**
     * Search term or expression.
     * @minLength 1
     * @maxLength 100
     */
    expression?: string | null;
    /**
     * Currently supported fields for search:
     *
     * - `loginEmail`
     * - `contact.firstName`
     * - `contact.lastName`
     * - `profile.title`
     * - `profile.nickname`
     * - `profile.slug`
     *
     * Default: `profile.nickname`.
     * @maxSize 4
     */
    fields?: string[];
}
export interface QueryMembersResponse {
    /** List of members that met the query filter criteria. */
    members?: Member[];
    /** Metadata for the paginated results. */
    metadata?: PagingMetadata;
}
export interface MuteMemberRequest {
    /**
     * ID of the member to mute.
     * @format GUID
     */
    _id: string;
}
export interface MuteMemberResponse {
    /** Muted member. */
    member?: Member;
}
export interface MemberMuted {
    /**
     * ID of the member who got muted.
     * @format GUID
     * @readonly
     */
    memberId?: string;
}
export interface UnmuteMemberRequest {
    /**
     * ID of the member to unmute.
     * @format GUID
     */
    _id: string;
}
export interface UnmuteMemberResponse {
    /** Unmuted member. */
    member?: Member;
}
export interface MemberUnmuted {
    /**
     * ID of the member who got unmuted.
     * @format GUID
     * @readonly
     */
    memberId?: string;
}
export interface ApproveMemberRequest {
    /**
     * ID of the member to approve.
     * @format GUID
     */
    _id: string;
}
export interface ApproveMemberResponse {
    /** Approved member. */
    member?: Member;
}
export interface MemberApproved {
    /**
     * ID of the member who got approved.
     * @format GUID
     * @readonly
     */
    memberId?: string;
}
export interface BlockMemberRequest {
    /**
     * ID of a member to block.
     * @format GUID
     */
    _id: string;
}
export interface BlockMemberResponse {
    /** Blocked member. */
    member?: Member;
}
export interface MemberBlocked {
    /**
     * ID of the member who got blocked.
     * @format GUID
     * @readonly
     */
    memberId?: string;
}
export interface MemberSelfBlockForbiddenPayload {
    /**
     * Target's member ID.
     * @format GUID
     */
    memberId?: string;
}
export interface OwnerMemberBlockForbiddenPayload {
    /**
     * Owner's member ID.
     * @format GUID
     */
    memberId?: string;
}
export interface ActiveSubscriptionMemberBlockForbiddenPayload {
    /**
     * Active subscription member ID.
     * @format GUID
     */
    memberId?: string;
}
export interface DisconnectMemberRequest {
    /**
     * ID of a member to disconnect.
     * @format GUID
     */
    _id: string;
}
export interface DisconnectMemberResponse {
    /** Disconnected member. */
    member?: Member;
}
export interface DeleteMemberRequest {
    /**
     * ID of a member to delete.
     * @format GUID
     */
    _id: string;
}
export interface DeleteMemberResponse {
}
export interface ContentReassignmentRequested {
    fromMember?: Member;
    toMember?: Member;
}
export interface ContentDeletionRequested {
    member?: Member;
}
export interface OwnerOrContributorDeleteForbiddenPayload {
    /**
     * Owner's or contributor's member ID.
     * @format GUID
     */
    memberId?: string;
}
export interface ActiveSubscriptionMemberDeleteForbiddenPayload {
    /**
     * Active subscription member ID.
     * @format GUID
     */
    memberId?: string;
}
export interface DeleteMyMemberRequest {
    /**
     * ID of a member receiving the deleted member's content.
     * @format GUID
     */
    contentAssigneeId?: string | null;
}
export interface DeleteMyMemberResponse {
}
export interface BulkDeleteMembersRequest {
    /**
     * IDs of members to be deleted.
     * @minSize 1
     * @maxSize 100
     * @format GUID
     */
    memberIds: string[];
}
export interface BulkDeleteMembersResponse {
    /** Result. */
    results?: BulkMemberResult[];
    /** Bulk action result metadata. */
    bulkActionMetadata?: BulkActionMetadata;
}
export interface ItemMetadata {
    /**
     * Item ID. Should always be available, unless it's impossible (for example, when failing to create an item).
     * @maxLength 255
     */
    _id?: string | null;
    /** Index of the item within the request array. Allows for correlation between request and response items. */
    originalIndex?: number;
    /** Whether the requested action was successful for this item. When `false`, the `error` field is populated. */
    success?: boolean;
    /** Details about the error in case of failure. */
    error?: ApplicationError;
}
export interface ApplicationError {
    /** Error code. */
    code?: string;
    /** Description of the error. */
    description?: string;
    /** Data related to the error. */
    data?: Record<string, any> | null;
}
export interface BulkMemberResult {
    itemMetadata?: ItemMetadata;
}
export interface BulkActionMetadata {
    /** Number of items that were successfully processed. */
    totalSuccesses?: number;
    /** Number of items that couldn't be processed. */
    totalFailures?: number;
    /** Number of failures without details because detailed failure threshold was exceeded. */
    undetailedFailures?: number;
}
export interface BulkDeleteMembersByFilterRequest {
    /** Query options. See API Query Language ([SDK](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/api-query-language) | [REST](https://dev.wix.com/docs/rest/articles/getting-started/api-query-language)) for more details. */
    filter: any;
    /**
     * ID of a member receiving the deleted member's content.
     * @format GUID
     */
    contentAssigneeId?: string | null;
    /** Plain text search. */
    search?: Search;
}
export interface BulkDeleteMembersByFilterResponse {
    /**
     * Job ID.
     * Specify this ID when calling Get Async Job ([SDK](https://dev.wix.com/docs/sdk/backend-modules/async-jobs/get-async-job) | [REST](https://dev.wix.com/docs/rest/business-management/async-job/introduction)) to retrieve job details and metadata.
     */
    jobId?: string;
}
export interface BulkApproveMembersRequest {
    /** Query options. See API Query Language ([SDK](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/api-query-language) | [REST](https://dev.wix.com/docs/rest/articles/getting-started/api-query-language)) for more details. */
    filter: any;
}
export interface BulkApproveMembersResponse {
    /**
     * Job ID.
     * Specify this ID when calling Get Async Job ([SDK](https://dev.wix.com/docs/sdk/backend-modules/async-jobs/get-async-job) | [REST](https://dev.wix.com/docs/rest/business-management/async-job/introduction)) to retrieve job details and metadata.
     */
    jobId?: string;
}
export interface BulkBlockMembersRequest {
    /** Query options. See API Query Language ([SDK](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/api-query-language) | [REST](https://dev.wix.com/docs/rest/articles/getting-started/api-query-language)) for more details. */
    filter: any;
}
export interface BulkBlockMembersResponse {
    /**
     * Job ID.
     * Specify this ID when calling Get Async Job ([SDK](https://dev.wix.com/docs/sdk/backend-modules/async-jobs/get-async-job) | [REST](https://dev.wix.com/docs/rest/business-management/async-job/introduction)) to retrieve job details and metadata.
     */
    jobId?: string;
}
export interface CreateMemberRequest {
    /** Member to create. */
    member?: Member;
}
export interface CreateMemberResponse {
    /** New member. */
    member?: Member;
}
export interface UpdateMemberRequest {
    /** Member info to update. */
    member?: Member;
}
export interface UpdateMemberResponse {
    /** Updated member. */
    member?: Member;
}
export interface InvalidCustomFieldUrlPayload {
    /** Custom field key and invalid URL. */
    fields?: Record<string, string>;
}
export interface DeleteMemberPhonesRequest {
    /**
     * ID of the member whose phone numbers will be deleted.
     * @format GUID
     */
    _id: string;
}
export interface DeleteMemberPhonesResponse {
    /** Updated member. */
    member?: Member;
}
export interface DeleteMemberEmailsRequest {
    /**
     * ID of the member whose email addresses will be deleted.
     * @format GUID
     */
    _id: string;
}
export interface DeleteMemberEmailsResponse {
    /** Updated member. */
    member?: Member;
}
export interface DeleteMemberAddressesRequest {
    /**
     * ID of the member whose street addresses will be deleted.
     * @format GUID
     */
    _id: string;
}
export interface DeleteMemberAddressesResponse {
    /** Updated member. */
    member?: Member;
}
export interface Empty {
}
export interface DomainEvent extends DomainEventBodyOneOf {
    createdEvent?: EntityCreatedEvent;
    updatedEvent?: EntityUpdatedEvent;
    deletedEvent?: EntityDeletedEvent;
    actionEvent?: ActionEvent;
    /**
     * Unique event ID.
     * Allows clients to ignore duplicate webhooks.
     */
    _id?: string;
    /**
     * Assumes actions are also always typed to an entity_type
     * Example: wix.stores.catalog.product, wix.bookings.session, wix.payments.transaction
     */
    entityFqdn?: string;
    /**
     * This is top level to ease client code dispatching of messages (switch on entity_fqdn+slug)
     * This is although the created/updated/deleted notion is duplication of the oneof types
     * Example: created/updated/deleted/started/completed/email_opened
     */
    slug?: string;
    /** ID of the entity associated with the event. */
    entityId?: string;
    /** Event timestamp in [ISO-8601](https://en.wikipedia.org/wiki/ISO_8601) format and UTC time. For example: 2020-04-26T13:57:50.699Z */
    eventTime?: Date | null;
    /**
     * Whether the event was triggered as a result of a privacy regulation application
     * (for example, GDPR).
     */
    triggeredByAnonymizeRequest?: boolean | null;
    /** If present, indicates the action that triggered the event. */
    originatedFrom?: string | null;
    /**
     * A sequence number defining the order of updates to the underlying entity.
     * For example, given that some entity was updated at 16:00 and than again at 16:01,
     * it is guaranteed that the sequence number of the second update is strictly higher than the first.
     * As the consumer, you can use this value to ensure that you handle messages in the correct order.
     * To do so, you will need to persist this number on your end, and compare the sequence number from the
     * message against the one you have stored. Given that the stored number is higher, you should ignore the message.
     */
    entityEventSequence?: string | null;
}
/** @oneof */
export interface DomainEventBodyOneOf {
    createdEvent?: EntityCreatedEvent;
    updatedEvent?: EntityUpdatedEvent;
    deletedEvent?: EntityDeletedEvent;
    actionEvent?: ActionEvent;
}
export interface EntityCreatedEvent {
    entity?: string;
}
export interface RestoreInfo {
    deletedDate?: Date | null;
}
export interface EntityUpdatedEvent {
    /**
     * Since platformized APIs only expose PATCH and not PUT we can't assume that the fields sent from the client are the actual diff.
     * This means that to generate a list of changed fields (as opposed to sent fields) one needs to traverse both objects.
     * We don't want to impose this on all developers and so we leave this traversal to the notification recipients which need it.
     */
    currentEntity?: string;
}
export interface EntityDeletedEvent {
    /** Entity that was deleted */
    deletedEntity?: string | null;
}
export interface ActionEvent {
    body?: string;
}
export interface MetaSiteSpecialEvent extends MetaSiteSpecialEventPayloadOneOf {
    /** Emitted on a meta site creation. */
    siteCreated?: SiteCreated;
    /** Emitted on a meta site transfer completion. */
    siteTransferred?: SiteTransferred;
    /** Emitted on a meta site deletion. */
    siteDeleted?: SiteDeleted;
    /** Emitted on a meta site restoration. */
    siteUndeleted?: SiteUndeleted;
    /** Emitted on the first* publish of the meta site (* switching from unpublished to published state). */
    sitePublished?: SitePublished;
    /** Emitted on a meta site unpublish. */
    siteUnpublished?: SiteUnpublished;
    /** Emitted when meta site is marked as template. */
    siteMarkedAsTemplate?: SiteMarkedAsTemplate;
    /** Emitted when meta site is marked as a WixSite. */
    siteMarkedAsWixSite?: SiteMarkedAsWixSite;
    /** Emitted when an application is provisioned (installed). */
    serviceProvisioned?: ServiceProvisioned;
    /** Emitted when an application is removed (uninstalled). */
    serviceRemoved?: ServiceRemoved;
    /** Emitted when meta site name (URL slug) is changed. */
    siteRenamedPayload?: SiteRenamed;
    /** Emitted when meta site was permanently deleted. */
    hardDeleted?: SiteHardDeleted;
    /** Emitted on a namespace change. */
    namespaceChanged?: NamespaceChanged;
    /** Emitted when Studio is attached. */
    studioAssigned?: StudioAssigned;
    /** Emitted when Studio is detached. */
    studioUnassigned?: StudioUnassigned;
    /**
     * Emitted when one of the URLs is changed. After this event you may call `urls-server` to fetch
     * the actual URL.
     *
     * See: https://wix.slack.com/archives/C0UHEBPFT/p1732520791210559?thread_ts=1732027914.294059&cid=C0UHEBPFT
     * See: https://wix.slack.com/archives/C0UHEBPFT/p1744115197619459
     */
    urlChanged?: SiteUrlChanged;
    /** Site is marked as PurgedExternally */
    sitePurgedExternally?: SitePurgedExternally;
    /**
     * A meta site id.
     * @format GUID
     */
    metaSiteId?: string;
    /** A meta site version. Monotonically increasing. */
    version?: string;
    /** A timestamp of the event. */
    timestamp?: string;
    /**
     * TODO(meta-site): Change validation once validations are disabled for consumers
     * More context: https://wix.slack.com/archives/C0UHEBPFT/p1720957844413149 and https://wix.slack.com/archives/CFWKX325T/p1728892152855659
     * @maxSize 4000
     */
    assets?: Asset[];
}
/** @oneof */
export interface MetaSiteSpecialEventPayloadOneOf {
    /** Emitted on a meta site creation. */
    siteCreated?: SiteCreated;
    /** Emitted on a meta site transfer completion. */
    siteTransferred?: SiteTransferred;
    /** Emitted on a meta site deletion. */
    siteDeleted?: SiteDeleted;
    /** Emitted on a meta site restoration. */
    siteUndeleted?: SiteUndeleted;
    /** Emitted on the first* publish of the meta site (* switching from unpublished to published state). */
    sitePublished?: SitePublished;
    /** Emitted on a meta site unpublish. */
    siteUnpublished?: SiteUnpublished;
    /** Emitted when meta site is marked as template. */
    siteMarkedAsTemplate?: SiteMarkedAsTemplate;
    /** Emitted when meta site is marked as a WixSite. */
    siteMarkedAsWixSite?: SiteMarkedAsWixSite;
    /** Emitted when an application is provisioned (installed). */
    serviceProvisioned?: ServiceProvisioned;
    /** Emitted when an application is removed (uninstalled). */
    serviceRemoved?: ServiceRemoved;
    /** Emitted when meta site name (URL slug) is changed. */
    siteRenamedPayload?: SiteRenamed;
    /** Emitted when meta site was permanently deleted. */
    hardDeleted?: SiteHardDeleted;
    /** Emitted on a namespace change. */
    namespaceChanged?: NamespaceChanged;
    /** Emitted when Studio is attached. */
    studioAssigned?: StudioAssigned;
    /** Emitted when Studio is detached. */
    studioUnassigned?: StudioUnassigned;
    /**
     * Emitted when one of the URLs is changed. After this event you may call `urls-server` to fetch
     * the actual URL.
     *
     * See: https://wix.slack.com/archives/C0UHEBPFT/p1732520791210559?thread_ts=1732027914.294059&cid=C0UHEBPFT
     * See: https://wix.slack.com/archives/C0UHEBPFT/p1744115197619459
     */
    urlChanged?: SiteUrlChanged;
    /** Site is marked as PurgedExternally */
    sitePurgedExternally?: SitePurgedExternally;
}
export interface Asset {
    /**
     * An application definition id (app_id in dev-center). For legacy reasons may be UUID or a string (from Java Enum).
     * @maxLength 36
     */
    appDefId?: string;
    /**
     * An instance id. For legacy reasons may be UUID or a string.
     * @maxLength 200
     */
    instanceId?: string;
    /** An application state. */
    state?: State;
}
export declare enum State {
    UNKNOWN = "UNKNOWN",
    ENABLED = "ENABLED",
    DISABLED = "DISABLED",
    PENDING = "PENDING",
    DEMO = "DEMO"
}
export interface SiteCreated {
    /**
     * A template identifier (empty if not created from a template).
     * @maxLength 36
     */
    originTemplateId?: string;
    /**
     * An account id of the owner.
     * @format GUID
     */
    ownerId?: string;
    /** A context in which meta site was created. */
    context?: SiteCreatedContext;
    /**
     * A meta site id from which this site was created.
     *
     * In case of a creation from a template it's a template id.
     * In case of a site duplication ("Save As" in dashboard or duplicate in UM) it's an id of a source site.
     * @format GUID
     */
    originMetaSiteId?: string | null;
    /**
     * A meta site name (URL slug).
     * @maxLength 20
     */
    siteName?: string;
    /** A namespace. */
    namespace?: Namespace;
}
export declare enum SiteCreatedContext {
    /** A valid option, we don't expose all reasons why site might be created. */
    OTHER = "OTHER",
    /** A meta site was created from template. */
    FROM_TEMPLATE = "FROM_TEMPLATE",
    /** A meta site was created by copying of the transfferred meta site. */
    DUPLICATE_BY_SITE_TRANSFER = "DUPLICATE_BY_SITE_TRANSFER",
    /** A copy of existing meta site. */
    DUPLICATE = "DUPLICATE",
    /** A meta site was created as a transfferred site (copy of the original), old flow, should die soon. */
    OLD_SITE_TRANSFER = "OLD_SITE_TRANSFER",
    /** deprecated A meta site was created for Flash editor. */
    FLASH = "FLASH"
}
export declare enum Namespace {
    UNKNOWN_NAMESPACE = "UNKNOWN_NAMESPACE",
    /** Default namespace for UGC sites. MetaSites with this namespace will be shown in a user's site list by default. */
    WIX = "WIX",
    /** ShoutOut stand alone product. These are siteless (no actual Wix site, no HtmlWeb). MetaSites with this namespace will *not* be shown in a user's site list by default. */
    SHOUT_OUT = "SHOUT_OUT",
    /** MetaSites created by the Albums product, they appear as part of the Albums app. MetaSites with this namespace will *not* be shown in a user's site list by default. */
    ALBUMS = "ALBUMS",
    /** Part of the WixStores migration flow, a user tries to migrate and gets this site to view and if the user likes it then stores removes this namespace and deletes the old site with the old stores. MetaSites with this namespace will *not* be shown in a user's site list by default. */
    WIX_STORES_TEST_DRIVE = "WIX_STORES_TEST_DRIVE",
    /** Hotels standalone (siteless). MetaSites with this namespace will *not* be shown in a user's site list by default. */
    HOTELS = "HOTELS",
    /** Clubs siteless MetaSites, a club without a wix website. MetaSites with this namespace will *not* be shown in a user's site list by default. */
    CLUBS = "CLUBS",
    /** A partially created ADI website. MetaSites with this namespace will *not* be shown in a user's site list by default. */
    ONBOARDING_DRAFT = "ONBOARDING_DRAFT",
    /** AppBuilder for AppStudio / shmite (c). MetaSites with this namespace will *not* be shown in a user's site list by default. */
    DEV_SITE = "DEV_SITE",
    /** LogoMaker websites offered to the user after logo purchase. MetaSites with this namespace will *not* be shown in a user's site list by default. */
    LOGOS = "LOGOS",
    /** VideoMaker websites offered to the user after video purchase. MetaSites with this namespace will *not* be shown in a user's site list by default. */
    VIDEO_MAKER = "VIDEO_MAKER",
    /** MetaSites with this namespace will *not* be shown in a user's site list by default. */
    PARTNER_DASHBOARD = "PARTNER_DASHBOARD",
    /** MetaSites with this namespace will *not* be shown in a user's site list by default. */
    DEV_CENTER_COMPANY = "DEV_CENTER_COMPANY",
    /**
     * A draft created by HTML editor on open. Upon "first save" it will be moved to be of WIX domain.
     *
     * Meta site with this namespace will *not* be shown in a user's site list by default.
     */
    HTML_DRAFT = "HTML_DRAFT",
    /**
     * the user-journey for Fitness users who want to start from managing their business instead of designing their website.
     * Will be accessible from Site List and will not have a website app.
     * Once the user attaches a site, the site will become a regular wixsite.
     */
    SITELESS_BUSINESS = "SITELESS_BUSINESS",
    /** Belongs to "strategic products" company. Supports new product in the creator's economy space. */
    CREATOR_ECONOMY = "CREATOR_ECONOMY",
    /** It is to be used in the Business First efforts. */
    DASHBOARD_FIRST = "DASHBOARD_FIRST",
    /** Bookings business flow with no site. */
    ANYWHERE = "ANYWHERE",
    /** Namespace for Headless Backoffice with no editor */
    HEADLESS = "HEADLESS",
    /**
     * Namespace for master site that will exist in parent account that will be referenced by subaccounts
     * The site will be used for account level CSM feature for enterprise
     */
    ACCOUNT_MASTER_CMS = "ACCOUNT_MASTER_CMS",
    /** Rise.ai Siteless account management for Gift Cards and Store Credit. */
    RISE = "RISE",
    /**
     * As part of the branded app new funnel, users now can create a meta site that will be branded app first.
     * There's a blank site behind the scene but it's blank).
     * The Mobile company will be the owner of this namespace.
     */
    BRANDED_FIRST = "BRANDED_FIRST",
    /** Nownia.com Siteless account management for Ai Scheduling Assistant. */
    NOWNIA = "NOWNIA",
    /**
     * UGC Templates are templates that are created by users for personal use and to sale to other users.
     * The Partners company owns this namespace.
     */
    UGC_TEMPLATE = "UGC_TEMPLATE",
    /** Codux Headless Sites */
    CODUX = "CODUX",
    /** Bobb - AI Design Creator. */
    MEDIA_DESIGN_CREATOR = "MEDIA_DESIGN_CREATOR",
    /**
     * Shared Blog Site is a unique single site across Enterprise account,
     * This site will hold all Blog posts related to the Marketing product.
     */
    SHARED_BLOG_ENTERPRISE = "SHARED_BLOG_ENTERPRISE",
    /** Standalone forms (siteless). MetaSites with this namespace will *not* be shown in a user's site list by default. */
    STANDALONE_FORMS = "STANDALONE_FORMS",
    /** Standalone events (siteless). MetaSites with this namespace will *not* be shown in a user's site list by default. */
    STANDALONE_EVENTS = "STANDALONE_EVENTS",
    /** MIMIR - Siteless account for MIMIR Ai Job runner. */
    MIMIR = "MIMIR"
}
/** Site transferred to another user. */
export interface SiteTransferred {
    /**
     * A previous owner id (user that transfers meta site).
     * @format GUID
     */
    oldOwnerId?: string;
    /**
     * A new owner id (user that accepts meta site).
     * @format GUID
     */
    newOwnerId?: string;
}
/** Soft deletion of the meta site. Could be restored. */
export interface SiteDeleted {
    /** A deletion context. */
    deleteContext?: DeleteContext;
}
export interface DeleteContext {
    /** When the meta site was deleted. */
    dateDeleted?: Date | null;
    /** A status. */
    deleteStatus?: DeleteStatus;
    /**
     * A reason (flow).
     * @maxLength 255
     */
    deleteOrigin?: string;
    /**
     * A service that deleted it.
     * @maxLength 255
     */
    initiatorId?: string | null;
}
export declare enum DeleteStatus {
    UNKNOWN = "UNKNOWN",
    TRASH = "TRASH",
    DELETED = "DELETED",
    PENDING_PURGE = "PENDING_PURGE",
    PURGED_EXTERNALLY = "PURGED_EXTERNALLY"
}
/** Restoration of the meta site. */
export interface SiteUndeleted {
}
/** First publish of a meta site. Or subsequent publish after unpublish. */
export interface SitePublished {
}
export interface SiteUnpublished {
    /**
     * A list of URLs previously associated with the meta site.
     * @maxLength 4000
     * @maxSize 10000
     */
    urls?: string[];
}
export interface SiteMarkedAsTemplate {
}
export interface SiteMarkedAsWixSite {
}
/**
 * Represents a service provisioned a site.
 *
 * Note on `origin_instance_id`:
 * There is no guarantee that you will be able to find a meta site using `origin_instance_id`.
 * This is because of the following scenario:
 *
 * Imagine you have a template where a third-party application (TPA) includes some stub data,
 * such as a product catalog. When you create a site from this template, you inherit this
 * default product catalog. However, if the template's product catalog is modified,
 * your site will retain the catalog as it was at the time of site creation. This ensures that
 * your site remains consistent with what you initially received and does not include any
 * changes made to the original template afterward.
 * To ensure this, the TPA on the template gets a new instance_id.
 */
export interface ServiceProvisioned {
    /**
     * Either UUID or EmbeddedServiceType.
     * @maxLength 36
     */
    appDefId?: string;
    /**
     * Not only UUID. Something here could be something weird.
     * @maxLength 36
     */
    instanceId?: string;
    /**
     * An instance id from which this instance is originated.
     * @maxLength 36
     */
    originInstanceId?: string;
    /**
     * A version.
     * @maxLength 500
     */
    version?: string | null;
    /**
     * The origin meta site id
     * @format GUID
     */
    originMetaSiteId?: string | null;
}
export interface ServiceRemoved {
    /**
     * Either UUID or EmbeddedServiceType.
     * @maxLength 36
     */
    appDefId?: string;
    /**
     * Not only UUID. Something here could be something weird.
     * @maxLength 36
     */
    instanceId?: string;
    /**
     * A version.
     * @maxLength 500
     */
    version?: string | null;
}
/** Rename of the site. Meaning, free public url has been changed as well. */
export interface SiteRenamed {
    /**
     * A new meta site name (URL slug).
     * @maxLength 20
     */
    newSiteName?: string;
    /**
     * A previous meta site name (URL slug).
     * @maxLength 255
     */
    oldSiteName?: string;
}
/**
 * Hard deletion of the meta site.
 *
 * Could not be restored. Therefore it's desirable to cleanup data.
 */
export interface SiteHardDeleted {
    /** A deletion context. */
    deleteContext?: DeleteContext;
}
export interface NamespaceChanged {
    /** A previous namespace. */
    oldNamespace?: Namespace;
    /** A new namespace. */
    newNamespace?: Namespace;
}
/** Assigned Studio editor */
export interface StudioAssigned {
}
/** Unassigned Studio editor */
export interface StudioUnassigned {
}
/**
 * Fired in case site URLs were changed in any way: new secondary domain, published, account slug rename, site rename etc.
 *
 * This is an internal event, it's not propagated in special events, because it's non-actionable. If you need to keep up
 * with sites and its urls, you need to listen to another topic/event. Read about it:
 *
 * https://bo.wix.com/wix-docs/rest/meta-site/meta-site---urls-service
 */
export interface SiteUrlChanged {
}
/**
 * Used at the end of the deletion flow for both draft sites and when a user deletes a site.
 * Consumed by other teams to remove relevant data.
 */
export interface SitePurgedExternally {
    /**
     * @maxLength 2048
     * @maxSize 100
     * @deprecated
     * @targetRemovalDate 2025-04-15
     */
    appDefId?: string[];
}
export interface MemberOwnershipTransferred {
    fromMember?: Member;
    toMember?: Member;
}
export interface MemberIdChanged {
    /** @format GUID */
    fromId?: string;
    /** @format GUID */
    toId?: string;
}
export interface MessageEnvelope {
    /**
     * App instance ID.
     * @format GUID
     */
    instanceId?: string | null;
    /**
     * Event type.
     * @maxLength 150
     */
    eventType?: string;
    /** The identification type and identity data. */
    identity?: IdentificationData;
    /** Stringify payload. */
    data?: string;
}
export interface IdentificationData extends IdentificationDataIdOneOf {
    /**
     * ID of a site visitor that has not logged in to the site.
     * @format GUID
     */
    anonymousVisitorId?: string;
    /**
     * ID of a site visitor that has logged in to the site.
     * @format GUID
     */
    memberId?: string;
    /**
     * ID of a Wix user (site owner, contributor, etc.).
     * @format GUID
     */
    wixUserId?: string;
    /**
     * ID of an app.
     * @format GUID
     */
    appId?: string;
    /** @readonly */
    identityType?: WebhookIdentityType;
}
/** @oneof */
export interface IdentificationDataIdOneOf {
    /**
     * ID of a site visitor that has not logged in to the site.
     * @format GUID
     */
    anonymousVisitorId?: string;
    /**
     * ID of a site visitor that has logged in to the site.
     * @format GUID
     */
    memberId?: string;
    /**
     * ID of a Wix user (site owner, contributor, etc.).
     * @format GUID
     */
    wixUserId?: string;
    /**
     * ID of an app.
     * @format GUID
     */
    appId?: string;
}
export declare enum WebhookIdentityType {
    UNKNOWN = "UNKNOWN",
    ANONYMOUS_VISITOR = "ANONYMOUS_VISITOR",
    MEMBER = "MEMBER",
    WIX_USER = "WIX_USER",
    APP = "APP"
}
export interface BaseEventMetadata {
    /**
     * App instance ID.
     * @format GUID
     */
    instanceId?: string | null;
    /**
     * Event type.
     * @maxLength 150
     */
    eventType?: string;
    /** The identification type and identity data. */
    identity?: IdentificationData;
}
export interface EventMetadata extends BaseEventMetadata {
    /**
     * Unique event ID.
     * Allows clients to ignore duplicate webhooks.
     */
    _id?: string;
    /**
     * Assumes actions are also always typed to an entity_type
     * Example: wix.stores.catalog.product, wix.bookings.session, wix.payments.transaction
     */
    entityFqdn?: string;
    /**
     * This is top level to ease client code dispatching of messages (switch on entity_fqdn+slug)
     * This is although the created/updated/deleted notion is duplication of the oneof types
     * Example: created/updated/deleted/started/completed/email_opened
     */
    slug?: string;
    /** ID of the entity associated with the event. */
    entityId?: string;
    /** Event timestamp in [ISO-8601](https://en.wikipedia.org/wiki/ISO_8601) format and UTC time. For example: 2020-04-26T13:57:50.699Z */
    eventTime?: Date | null;
    /**
     * Whether the event was triggered as a result of a privacy regulation application
     * (for example, GDPR).
     */
    triggeredByAnonymizeRequest?: boolean | null;
    /** If present, indicates the action that triggered the event. */
    originatedFrom?: string | null;
    /**
     * A sequence number defining the order of updates to the underlying entity.
     * For example, given that some entity was updated at 16:00 and than again at 16:01,
     * it is guaranteed that the sequence number of the second update is strictly higher than the first.
     * As the consumer, you can use this value to ensure that you handle messages in the correct order.
     * To do so, you will need to persist this number on your end, and compare the sequence number from the
     * message against the one you have stored. Given that the stored number is higher, you should ignore the message.
     */
    entityEventSequence?: string | null;
}
export interface MemberCreatedEnvelope {
    entity: Member;
    metadata: EventMetadata;
}
/**
 * Triggered when a member is created.
 *
 * The site owner can configure the site to automatically approve members or require manual approval.
 *
 * A member who has been approved either automatically or manually has a `status` of `"APPROVED"`. A created member waiting for approval has a `status` of `"PENDING"`. A `"PENDING"` member can't log in to the site.
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Read Members and Contacts - all read permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.READ-MEMBERS-CONTACTS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Read Members
 * @permissionScopeId SCOPE.DC-MEMBERS.READ-MEMBERS
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @permissionScope Manage Members and Contacts - all permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.MANAGE-MEMBERS-CONTACTS
 * @permissionId MEMBERS.MEMBER_READ
 * @webhook
 * @eventType wix.members.v1.member_created
 * @serviceIdentifier com.wixpress.members.api.Members
 * @slug created
 */
export declare function onMemberCreated(handler: (event: MemberCreatedEnvelope) => void | Promise<void>): void;
export interface MemberDeletedEnvelope {
    metadata: EventMetadata;
}
/**
 * Triggered when a member is deleted.
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Read Members and Contacts - all read permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.READ-MEMBERS-CONTACTS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Read Members
 * @permissionScopeId SCOPE.DC-MEMBERS.READ-MEMBERS
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @permissionScope Manage Members and Contacts - all permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.MANAGE-MEMBERS-CONTACTS
 * @permissionId MEMBERS.MEMBER_READ
 * @webhook
 * @eventType wix.members.v1.member_deleted
 * @serviceIdentifier com.wixpress.members.api.Members
 * @slug deleted
 */
export declare function onMemberDeleted(handler: (event: MemberDeletedEnvelope) => void | Promise<void>): void;
export interface MemberUpdatedEnvelope {
    entity: Member;
    metadata: EventMetadata;
}
/** @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Read Members and Contacts - all read permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.READ-MEMBERS-CONTACTS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Read Members
 * @permissionScopeId SCOPE.DC-MEMBERS.READ-MEMBERS
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @permissionScope Manage Members and Contacts - all permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.MANAGE-MEMBERS-CONTACTS
 * @permissionId MEMBERS.MEMBER_READ
 * @webhook
 * @eventType wix.members.v1.member_updated
 * @serviceIdentifier com.wixpress.members.api.Members
 * @slug updated
 */
export declare function onMemberUpdated(handler: (event: MemberUpdatedEnvelope) => void | Promise<void>): void;
type MemberNonNullablePaths = `status` | `contact.phones` | `contact.emails` | `contact.addresses` | `contact.addresses.${number}.streetAddress.number` | `contact.addresses.${number}.streetAddress.name` | `profile.photo._id` | `profile.photo.url` | `profile.photo.height` | `profile.photo.width` | `privacyStatus` | `activityStatus`;
/**
 * Updates the currently logged in member's slug.
 *
 * The `slug` is the end of a member's URL that refers to a specific logged-in member. For example, if a member's URL is `https://example.com/member/{my-member-slug}`, the slug is `my-member-slug`. The slug is case-sensitive and is generally derived from the member's `nickname`; otherwise, it's derived from the `loginEmail`.
 *
 * > **Note:**
 * > Only logged-in members can call this method without elevated permissions.
 * > To call this method as a different identity, [elevated permissions](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/about-elevated-permissions) are required.
 * @param slug - New slug.
 * @public
 * @requiredField slug
 * @permissionId MEMBERS.MEMBER_UPDATE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @applicableIdentity APP
 * @applicableIdentity MEMBER
 * @fqn com.wixpress.members.api.Members.UpdateMySlug
 */
export declare function updateCurrentMemberSlug(slug: string): Promise<NonNullablePaths<UpdateMySlugResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Updates a member's slug.
 * @param _id - Member ID.
 * @param slug - New slug.
 * @public
 * @requiredField _id
 * @requiredField slug
 * @permissionId MEMBERS.MEMBER_UPDATE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @applicableIdentity APP
 * @applicableIdentity MEMBER
 * @fqn com.wixpress.members.api.Members.UpdateMemberSlug
 */
export declare function updateMemberSlug(_id: string, slug: string): Promise<NonNullablePaths<UpdateMemberSlugResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Joins the current member to the site community and sets their profile to public.
 *
 * When a member's profile is public, they have access to the site's
 * [Members Area](https://support.wix.com/en/article/site-members-about-the-members-area)
 * features, such as chat, forum, and followers,
 * and their profile is visible to other members and site visitors.
 *
 * > **Note:**
 * > Only logged-in members can call this method without elevated permissions.
 * > To call this method as a different identity, [elevated permissions](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/about-elevated-permissions) are required.
 * @public
 * @permissionId MEMBERS.MEMBER_JOIN_COMMUNITY
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @applicableIdentity MEMBER
 * @returns Member profile.
 * @fqn com.wixpress.members.api.Members.JoinCommunity
 */
export declare function joinCommunity(): Promise<NonNullablePaths<JoinCommunityResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Removes the current member from the site community and sets their profile to private.
 *
 * When a member's profile is private,
 * they do not have access to the site's
 * [Members Area](https://support.wix.com/en/article/site-members-about-the-members-area)
 * features, such as chat, forum, and followers,
 * and their profile is hidden from other members and site visitors.
 *
 * > **Notes:**
 * > + If a member leaves the site's community, their content, such as forum posts and blog comments, remain publicly visible.
 *
 * > + Only logged-in members can call this method without elevated permissions.
 * > + To call this method as a different identity, [elevated permissions](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/about-elevated-permissions) are required.
 * @public
 * @permissionId MEMBERS.MEMBER_JOIN_COMMUNITY
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @applicableIdentity MEMBER
 * @returns Member profile.
 * @fqn com.wixpress.members.api.Members.LeaveCommunity
 */
export declare function leaveCommunity(): Promise<NonNullablePaths<LeaveCommunityResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Retrieves the current member.
 *
 * >**Note:**
 * >This method requires [visitor or member authentication](https://dev.wix.com/docs/build-apps/develop-your-app/access/about-identities).
 * @public
 * @permissionId MEMBERS.MEMBER_READ
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Read Members and Contacts - all read permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.READ-MEMBERS-CONTACTS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Read Members
 * @permissionScopeId SCOPE.DC-MEMBERS.READ-MEMBERS
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @permissionScope Manage Members and Contacts - all permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.MANAGE-MEMBERS-CONTACTS
 * @applicableIdentity APP
 * @applicableIdentity VISITOR
 * @returns Member profile.
 * @fqn com.wixpress.members.api.Members.GetMyMember
 */
export declare function getCurrentMember(options?: GetCurrentMemberOptions): Promise<NonNullablePaths<GetMyMemberResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
export interface GetCurrentMemberOptions {
    /**
     * Predefined set of fields to return.
     *
     * Default: `"PUBLIC"`.
     * @maxSize 3
     */
    fieldsets?: Set[];
}
/**
 * Retrieves a member by ID.
 *
 * >**Note:** The returned Member object contains only the fields that were explicitly added to the Member object. Custom Contact fields are **not** automatically added to the Member object. They must be [added to the Member object by the site owner](https://support.wix.com/en/article/site-members-customizing-your-member-profile-fields).
 *
 * @param _id - Member ID.
 * @public
 * @requiredField _id
 * @param options - Fieldset options.
 * @permissionId MEMBERS.MEMBER_READ
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Read Members and Contacts - all read permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.READ-MEMBERS-CONTACTS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Read Members
 * @permissionScopeId SCOPE.DC-MEMBERS.READ-MEMBERS
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @permissionScope Manage Members and Contacts - all permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.MANAGE-MEMBERS-CONTACTS
 * @applicableIdentity APP
 * @applicableIdentity VISITOR
 * @returns The requested member.
 * @fqn com.wixpress.members.api.Members.GetMember
 */
export declare function getMember(_id: string, options?: GetMemberOptions): Promise<NonNullablePaths<Member, MemberNonNullablePaths>>;
export interface GetMemberOptions {
    /**
     * Predefined set of fields to return.
     *
     * Defaults to `"PUBLIC"`.
     * @maxSize 3
     */
    fieldsets?: Set[];
}
/**
 * Lists site members, given the provided paging and fieldsets.
 * @public
 * @param options - Options for paging, sorting, and specifying fields to return.
 * @permissionId MEMBERS.MEMBER_READ
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Read Members and Contacts - all read permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.READ-MEMBERS-CONTACTS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Read Members
 * @permissionScopeId SCOPE.DC-MEMBERS.READ-MEMBERS
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @permissionScope Manage Members and Contacts - all permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.MANAGE-MEMBERS-CONTACTS
 * @applicableIdentity APP
 * @applicableIdentity VISITOR
 * @fqn com.wixpress.members.api.Members.ListMembers
 */
export declare function listMembers(options?: ListMembersOptions): Promise<NonNullablePaths<ListMembersResponse, {
    [P in MemberNonNullablePaths]: `members.${number}.${P}`;
}[MemberNonNullablePaths]>>;
export interface ListMembersOptions {
    /** Paging options. */
    paging?: Paging;
    /**
     * Predefined sets of fields to return.
     *
     * Default: `"PUBLIC"`.
     * @maxSize 3
     */
    fieldsets?: Set[];
    /** Sorting options. */
    sorting?: Sorting[];
}
/**
 * Retrieves a list of up to 100 members, given the specified filters, fieldsets, sorting and paging, and returns a `MembersQueryBuilder` object.
 *
 * The returned object contains the query definition which is typically used to run the query using the `find()` method.
 *
 * You can refine the query by chaining `MembersQueryBuilder` methods onto the query. `MembersQueryBuilder` methods enable you to sort, filter, and control the results that `queryMembers()` returns. The methods that are chained to `queryMembers()` are applied in the order they are called.
 *
 * `queryMembers()` runs with the following `MembersQueryBuilder` defaults that you can override:
 * - `skip`: `0`
 * - `limit`: `50`
 *
 * Currently supported fields for sorting:
 * - `profile.nickname`
 * - `contact.firstName`
 * - `contact.lastName`
 * - `createdDate`
 * - `lastLoginDate`
 *
 * The following `MembersQueryBuilder` methods are supported for the `queryMembers()` method. For a full description of the Locations object, see the returned for the `items` property in `MembersQueryResult`.
 * @public
 * @param options - Query options.
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Read Members and Contacts - all read permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.READ-MEMBERS-CONTACTS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Read Members
 * @permissionScopeId SCOPE.DC-MEMBERS.READ-MEMBERS
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @permissionScope Manage Members and Contacts - all permissions
 * @permissionScopeId SCOPE.DC-CONTACTS-MEGA.MANAGE-MEMBERS-CONTACTS
 * @permissionId MEMBERS.MEMBER_READ
 * @applicableIdentity APP
 * @applicableIdentity VISITOR
 * @fqn com.wixpress.members.api.Members.QueryMembers
 */
export declare function queryMembers(options?: QueryMembersOptions): MembersQueryBuilder;
export interface QueryMembersOptions {
    /**
     * Predefined sets of fields to return.
     *
     * Default: `"PUBLIC"`.
     * @maxSize 3
     */
    fieldsets?: Set[] | undefined;
    /** Plain text search. */
    search?: Search | undefined;
}
interface QueryOffsetResult {
    currentPage: number | undefined;
    totalPages: number | undefined;
    totalCount: number | undefined;
    hasNext: () => boolean;
    hasPrev: () => boolean;
    length: number;
    pageSize: number;
}
export interface MembersQueryResult extends QueryOffsetResult {
    items: Member[];
    query: MembersQueryBuilder;
    next: () => Promise<MembersQueryResult>;
    prev: () => Promise<MembersQueryResult>;
}
export interface MembersQueryBuilder {
    /** @param propertyName - Property whose value is compared with `value`.
     * @param value - Value to compare against.
     */
    eq: (propertyName: '_id' | 'loginEmail' | 'contactId' | 'contact.firstName' | 'contact.lastName' | 'profile.nickname' | 'profile.slug' | 'privacyStatus', value: any) => MembersQueryBuilder;
    /** @param propertyName - Property whose value is compared with `value`.
     * @param value - Value to compare against.
     */
    ne: (propertyName: '_id' | 'loginEmail' | 'contactId' | 'contact.firstName' | 'contact.lastName' | 'profile.nickname' | 'profile.slug' | 'privacyStatus', value: any) => MembersQueryBuilder;
    /** @param propertyName - Property whose value is compared with `string`.
     * @param string - String to compare against. Case-insensitive.
     */
    startsWith: (propertyName: '_id' | 'loginEmail' | 'contactId' | 'contact.firstName' | 'contact.lastName' | 'profile.nickname' | 'profile.slug', value: string) => MembersQueryBuilder;
    /** @param propertyName - Property whose value is compared with `values`.
     * @param values - List of values to compare against.
     */
    hasSome: (propertyName: '_id' | 'loginEmail' | 'contactId' | 'contact.firstName' | 'contact.lastName' | 'profile.nickname' | 'profile.slug' | 'privacyStatus', value: any[]) => MembersQueryBuilder;
    in: (propertyName: '_id' | 'loginEmail' | 'contactId' | 'contact.firstName' | 'contact.lastName' | 'profile.nickname' | 'profile.slug' | 'privacyStatus', value: any) => MembersQueryBuilder;
    exists: (propertyName: '_id' | 'loginEmail' | 'contactId' | 'contact.firstName' | 'contact.lastName' | 'profile.nickname' | 'profile.slug' | 'privacyStatus', value: boolean) => MembersQueryBuilder;
    /** @param limit - Number of items to return, which is also the `pageSize` of the results object. */
    limit: (limit: number) => MembersQueryBuilder;
    /** @param skip - Number of items to skip in the query results before returning the results. */
    skip: (skip: number) => MembersQueryBuilder;
    find: () => Promise<MembersQueryResult>;
}
/**
 * Mutes a member.
 *
 * Muted members can't engage with a community. For example, they can't leave comments, like posts or comments, or share content.
 *
 * You can mute members in [Wix Blog](https://dev.wix.com/docs/rest/business-solutions/blog/introduction) and [Wix Forum](https://dev.wix.com/docs/rest/business-solutions/forum/introduction).
 * @param _id - ID of the member to mute.
 * @public
 * @requiredField _id
 * @permissionId MEMBERS.MEMBER_MUTE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.MuteMember
 */
export declare function muteMember(_id: string): Promise<NonNullablePaths<MuteMemberResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Unmutes a member.
 *
 * Unmuted members can engage with the community. For example, leave comments, like posts or comments, and share content.
 *
 * You can unmute members in [Wix Blog](https://dev.wix.com/docs/rest/business-solutions/blog/introduction) and [Wix Forum](https://dev.wix.com/docs/rest/business-solutions/forum/introduction).
 * @param _id - ID of the member to unmute.
 * @public
 * @requiredField _id
 * @permissionId MEMBERS.MEMBER_MUTE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.UnmuteMember
 */
export declare function unmuteMember(_id: string): Promise<NonNullablePaths<UnmuteMemberResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Changes member status to `"APPROVED"` and gives access to members-only pages.
 *
 * Call this API to:
 * - Approve a pending member.
 * - Unblock a blocked member.
 * @param _id - ID of the member to approve.
 * @public
 * @requiredField _id
 * @permissionId MEMBERS.MEMBER_APPROVE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.ApproveMember
 */
export declare function approveMember(_id: string): Promise<NonNullablePaths<ApproveMemberResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Blocks a member.
 *
 * A blocked member can't log in to members-only pages.
 *
 * To unblock a member, call Approve Member.
 * @param _id - ID of a member to block.
 * @public
 * @requiredField _id
 * @permissionId MEMBERS.MEMBER_BLOCK
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.BlockMember
 */
export declare function blockMember(_id: string): Promise<NonNullablePaths<BlockMemberResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Disconnects a member.
 *
 * A disconnected member can't log in to members-only pages, and the member isn't visible in the dashboard.
 *
 * >**Note:** This action is irreversible. To connect the same member again, you have to create a member with a new slug.
 * @param _id - ID of a member to disconnect.
 * @public
 * @requiredField _id
 * @permissionId MEMBERS.MEMBER_DISCONNECT
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.DisconnectMember
 */
export declare function disconnectMember(_id: string): Promise<NonNullablePaths<DisconnectMemberResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Deletes a member by ID.
 *
 * All content created by this member is transferred to a site owner's account. For example, if a Wix user had blog posts, those posts are transferred to the site owner's account, which then becomes the owner of those posts.
 * @param _id - ID of a member to delete.
 * @public
 * @requiredField _id
 * @permissionId MEMBERS.MEMBER_DELETE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.DeleteMember
 */
export declare function deleteMember(_id: string): Promise<void>;
/**
 * Deletes the current member.
 *
 * After calling this method, the member is logged out of the site.
 *
 * All content created by this member is transferred to another account. For example, if a Wix user had blog posts, those posts are transferred to the account specified in `contentAssignedId`, which then becomes the owner of those posts.
 *
 * >**Note:**
 * >This method requires [visitor or member authentication](https://dev.wix.com/docs/build-apps/develop-your-app/access/about-identities).
 * @public
 * @permissionId MEMBERS.MEMBER_DELETE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.DeleteMyMember
 */
export declare function deleteMyMember(options?: DeleteMyMemberOptions): Promise<void>;
export interface DeleteMyMemberOptions {
    /**
     * ID of a member receiving the deleted member's content.
     * @format GUID
     */
    contentAssigneeId?: string | null;
}
/**
 * Deletes multiple members by `memberId`.
 *
 * All content created by these members is transferred to a site owner's account. For example, if Wix users had blog posts, those posts are transferred to the site owner's account, which then becomes the owner of those posts.
 * @param memberIds - IDs of members to be deleted.
 * @public
 * @requiredField memberIds
 * @permissionId MEMBERS.MEMBER_DELETE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.BulkDeleteMembers
 */
export declare function bulkDeleteMembers(memberIds: string[]): Promise<NonNullablePaths<BulkDeleteMembersResponse, `results` | `results.${number}.itemMetadata.originalIndex` | `results.${number}.itemMetadata.success` | `results.${number}.itemMetadata.error.code` | `results.${number}.itemMetadata.error.description` | `bulkActionMetadata.totalSuccesses` | `bulkActionMetadata.totalFailures` | `bulkActionMetadata.undetailedFailures`>>;
/**
 * Deletes multiple members by the specified filter.
 *
 * All content created by these members is transferred to a site owner's account. For example, if Wix users had blog posts, those posts are transferred to the site owner's account, which then becomes the owner of those posts.
 * @param filter - Query options. See API Query Language ([SDK](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/api-query-language) | [REST](https://dev.wix.com/docs/rest/articles/getting-started/api-query-language)) for more details.
 * @public
 * @requiredField filter
 * @permissionId MEMBERS.MEMBER_DELETE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.BulkDeleteMembersByFilter
 */
export declare function bulkDeleteMembersByFilter(filter: any, options?: BulkDeleteMembersByFilterOptions): Promise<NonNullablePaths<BulkDeleteMembersByFilterResponse, `jobId`>>;
export interface BulkDeleteMembersByFilterOptions {
    /**
     * ID of a member receiving the deleted member's content.
     * @format GUID
     */
    contentAssigneeId?: string | null;
    /** Plain text search. */
    search?: Search;
}
/**
 * Changes status of multiple members to `"APPROVED"`, and gives access to members-only pages.
 *
 * Call this API to:
 * - Approve pending members.
 * - Unblock blocked members.
 * @param filter - Query options. See API Query Language ([SDK](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/api-query-language) | [REST](https://dev.wix.com/docs/rest/articles/getting-started/api-query-language)) for more details.
 * @public
 * @requiredField filter
 * @permissionId MEMBERS.MEMBER_APPROVE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.BulkApproveMembers
 */
export declare function bulkApproveMembers(filter: any): Promise<NonNullablePaths<BulkApproveMembersResponse, `jobId`>>;
/**
 * Blocks multiple members by a specified filter.
 *
 * Blocked members can't log in to members-only pages.
 *
 * To unblock multiple members, call Bulk Approve Members.
 * @param filter - Query options. See API Query Language ([SDK](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/api-query-language) | [REST](https://dev.wix.com/docs/rest/articles/getting-started/api-query-language)) for more details.
 * @public
 * @requiredField filter
 * @permissionId MEMBERS.MEMBER_BLOCK
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @applicableIdentity APP
 * @fqn com.wixpress.members.api.Members.BulkBlockMembers
 */
export declare function bulkBlockMembers(filter: any): Promise<NonNullablePaths<BulkBlockMembersResponse, `jobId`>>;
/**
 * Creates a site member.
 *
 * After creation, you can call
 * [Send Set Password Email ([SDK](https://dev.wix.com/docs/sdk/backend-modules/members/authentication/send-set-password-email) | [REST](https://dev.wix.com/docs/rest/crm/members-contacts/members/member-authentication/send-set-password-email))
 * to email the member with a link to set their password.
 * The member can log in to the site
 * when they set their password for the first time.
 *
 * > **Note:**
 * > When creating multiple members,
 * > set your requests at least 1 second apart to keep below rate limits.
 * @public
 * @permissionId MEMBERS.MEMBER_CREATE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @applicableIdentity APP
 * @returns New member.
 * @fqn com.wixpress.members.api.Members.CreateMember
 */
export declare function createMember(options?: CreateMemberOptions): Promise<NonNullablePaths<Member, MemberNonNullablePaths>>;
export interface CreateMemberOptions {
    /** Member to create. */
    member?: Member;
}
/**
 * Updates a member's properties.
 *
 * Only the requested fields are updated.
 * To clear a field's value, set an empty value with an empty string `""`.
 *
 * > **Note:**
 * > Updating the `contact.addresses`, `contact.emails`, or `contact.phones` array overwrites the entire array, so any existing values you want to retain must be passed in the `updateMember()` call along with the new values to add.
 * > However, passing an empty array will have no effect, and these methods must be used to clear all data from the respective array:
 * >- To clear `contact.addresses`, use `deleteMemberAddresses()`.
 * >- To clear `contact.emails`, use `deleteMemberEmails()`.
 * >- To clear `contact.phones`, use `deleteMemberPhones()`.
 *
 * > **Note:**
 * > Only logged-in members can call this method without elevated permissions.
 * > To call this method as a different identity, [elevated permissions](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/about-elevated-permissions) are required.
 * @param _id - Member ID.
 * @public
 * @requiredField _id
 * @requiredField member
 * @param options - Member to update.
 * @permissionId MEMBERS.MEMBER_UPDATE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @applicableIdentity APP
 * @applicableIdentity MEMBER
 * @returns Updated member.
 * @fqn com.wixpress.members.api.Members.UpdateMember
 */
export declare function updateMember(_id: string, member: UpdateMember): Promise<NonNullablePaths<Member, MemberNonNullablePaths>>;
export interface UpdateMember {
    /**
     * Member ID.
     * @format GUID
     * @readonly
     */
    _id?: string | null;
    /**
     * Email used by a member to log in to the site.
     * @format EMAIL
     */
    loginEmail?: string | null;
    /**
     * Whether the email used by a member has been verified.
     * @readonly
     */
    loginEmailVerified?: boolean | null;
    /**
     * Member site access status.
     * @readonly
     */
    status?: Status;
    /**
     * Contact ID.
     * @format GUID
     * @readonly
     */
    contactId?: string | null;
    /**
     * Member's contact information. Contact information is stored in the
     * [Contact List](https://www.wix.com/my-account/site-selector/?buttonText=Select%20Site&title=Select%20a%20Site&autoSelectOnSingleSite=true&actionUrl=https:%2F%2Fwww.wix.com%2Fdashboard%2F%7B%7BmetaSiteId%7D%7D%2Fcontacts).
     *
     * The full set of contact data can be accessed and managed with the
     * Contacts API ([SDK](https://dev.wix.com/docs/sdk/backend-modules/crm/contacts/introduction) | [REST](https://dev.wix.com/docs/rest/crm/members-contacts/contacts/contacts/introduction)).
     */
    contact?: Contact;
    /** Profile display details. */
    profile?: Profile;
    /** Member privacy status. */
    privacyStatus?: PrivacyStatusStatus;
    /**
     * Member activity status.
     * @readonly
     */
    activityStatus?: ActivityStatusStatus;
    /**
     * Date and time when the member was created.
     * @readonly
     */
    _createdDate?: Date | null;
    /**
     * Date and time when the member was updated.
     * @readonly
     */
    _updatedDate?: Date | null;
    /**
     * Date and time when the member last logged in to the site.
     * @readonly
     */
    lastLoginDate?: Date | null;
}
/**
 * Clears a member's phone numbers.
 *
 * `deleteMemberPhones()` clears the `phones` array under the `contact` property.
 *
 * > **Note:**
 * > Only logged-in members can call this method without elevated permissions.
 * > To call this method as a different identity, [elevated permissions](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/about-elevated-permissions) are required.
 * @param _id - ID of the member whose phone numbers will be deleted.
 * @public
 * @requiredField _id
 * @permissionId MEMBERS.MEMBER_UPDATE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @applicableIdentity APP
 * @applicableIdentity MEMBER
 * @fqn com.wixpress.members.api.Members.DeleteMemberPhones
 */
export declare function deleteMemberPhones(_id: string): Promise<NonNullablePaths<DeleteMemberPhonesResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Clears a member's email addresses.
 *
 * `deleteMemberEmails()` clears the `emails` array under the `contact` property.
 *
 * > **Notes:**
 * > A member can still log in with their `loginEmail`,
 * > which is not cleared when this method is called.
 *
 * > Only logged-in members can call this method without elevated permissions.
 * > To call this method as a different identity, [elevated permissions](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/about-elevated-permissions) are required.
 * @param _id - ID of the member whose email addresses will be deleted.
 * @public
 * @requiredField _id
 * @permissionId MEMBERS.MEMBER_UPDATE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @applicableIdentity APP
 * @applicableIdentity MEMBER
 * @fqn com.wixpress.members.api.Members.DeleteMemberEmails
 */
export declare function deleteMemberEmails(_id: string): Promise<NonNullablePaths<DeleteMemberEmailsResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
/**
 * Deletes a member's street addresses.
 *
 * `deleteMemberAddresses()` clears the `addresses` array under the `contact` property.
 *
 * > **Note:**
 * > Only logged-in members can call this method without elevated permissions.
 * > To call this method as a different identity, [elevated permissions](https://dev.wix.com/docs/sdk/articles/work-with-the-sdk/about-elevated-permissions) are required.
 * @param _id - ID of the member whose street addresses will be deleted.
 * @public
 * @requiredField _id
 * @permissionId MEMBERS.MEMBER_UPDATE
 * @permissionScope Manage Members
 * @permissionScopeId SCOPE.DC-MEMBERS.MANAGE-MEMBERS
 * @permissionScope Manage Bookings Services and Settings
 * @permissionScopeId SCOPE.BOOKINGS.CONFIGURATION
 * @permissionScope Manage Events
 * @permissionScopeId SCOPE.EVENTS.MANAGE-EVENTS
 * @permissionScope Manage Challenges
 * @permissionScopeId SCOPE.CHALLENGES.MANAGE
 * @permissionScope Manage Portfolio
 * @permissionScopeId SCOPE.PORTFOLIO.MANAGE-PORTFOLIO
 * @permissionScope Access Verticals by Automations
 * @permissionScopeId SCOPE.CRM.ACCESS-VERTICALS-BY-AUTOMATIONS
 * @permissionScope Manage Restaurants - all permissions
 * @permissionScopeId SCOPE.RESTAURANTS.MEGA-SCOPES
 * @permissionScope Set Up Automations
 * @permissionScopeId SCOPE.CRM.SETUP-AUTOMATIONS
 * @applicableIdentity APP
 * @applicableIdentity MEMBER
 * @fqn com.wixpress.members.api.Members.DeleteMemberAddresses
 */
export declare function deleteMemberAddresses(_id: string): Promise<NonNullablePaths<DeleteMemberAddressesResponse, {
    [P in MemberNonNullablePaths]: `member.${P}`;
}[MemberNonNullablePaths]>>;
export {};
export interface TelegramExport {
    name: string;
    type: string;
    id: number;
    messages: Message[];
}

export interface Message {
    id: number;
    type: string;
    date: string;
    date_unixtime: string;
    edited?: string;
    edited_unixtime?: string;
    from: string;
    from_id: string;
    text: string | TextPart[];
    text_entities: TextEntity[];

    // Photo
    photo?: string;
    photo_file_size?: number;
    width?: number;
    height?: number;

    // Video
    file?: string;
    file_name?: string;
    file_size?: number;
    media_type?: string;
    mime_type?: string;
    duration_seconds?: number;

    // Forward
    forwarded_from?: string;
    forwarded_from_id?: string;

    // Reply
    reply_to_message_id?: number;

    // Reactions
    reactions?: Reaction[];
}

export type TextPart = string | TextPartObject;

export interface TextPartObject {
    type: string;
    text: string;
    href?: string;
    document_id?: string;
    collapsed?: boolean;
}

export interface TextEntity {
    type: string;
    text: string;
    href?: string;
    document_id?: string;
    collapsed?: boolean;
}

export interface Reaction {
    type: string;
    count: number;
    emoji?: string;
    document_id?: string;
}

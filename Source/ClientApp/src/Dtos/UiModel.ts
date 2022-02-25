import { ProcessToAddDto } from "./ClientApiDto";

export interface UiProcessToAdd extends ProcessToAddDto {
    id: string;
    alias: undefined;
}

export enum NetworkActivityFormat {
    BitsPerSecond = "BitsPerSecond",
    BytesPerSecond = "BytesPerSecond"
}

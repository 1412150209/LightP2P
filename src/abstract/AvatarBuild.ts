export enum Styles {
    adventurer = "adventurer",
    avataaars = "avataaars",
    "Thumbs" = "thumbs",
    "Pixel Art" = "pixel-art",
    Personas = "personas",
    Notionists = "notionists",
    Lorelei = "lorelei",
    Initials = "initials",
    Glass = "glass",
    Croodles = "croodles",
}

export function get_avatar(style: Styles, seed: string) {
    if (seed.length == 0) {
        seed = "Default"
    }
    //todo: 修改为自己的api
    return `https://api.dicebear.com/9.x/${style.toLowerCase()}/svg?seed=${seed}`
}
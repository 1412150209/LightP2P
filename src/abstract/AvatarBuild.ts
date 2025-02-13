export enum Styles {
    adventurer = "adventurer",
    avataaars = "avataaars",
    "Thumbs" = "Thumbs",
    "Pixel Art" = "Pixel Art",
    Personas = "Personas",
    Notionists = "Notionists",
    Lorelei = "Lorelei",
    Initials = "Initials",
    Glass = "Glass",
    Croodles = "Croodles",
}

export function get_avatar(style: Styles, seed: string) {
    if (seed.length == 0) {
        seed = "Default"
    }
    //todo: 修改为自己的api
    return `https://api.dicebear.com/9.x/${style.toLowerCase()}/svg?seed=${seed}`
}
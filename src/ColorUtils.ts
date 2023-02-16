export type Color = {
  readonly name: string,
  readonly hex: string,
  readonly rgb: string,
};

export const MARKWHEN_COLORS: Array<Color> = [
  {
    name: "green",
    hex: "16A34C",
    rgb: "22, 163, 76",
  },
  {
    name: "blue",
    hex: "0284C7",
    rgb: "2, 132, 199",
  },
  {
    name: "red",
    hex: "D43238",
    rgb: "212, 50, 56",
  },
  {
    name: "yellow",
    hex: "F2CA2D",
    rgb: "242, 202, 45",
  },
  {
    name: "indigo",
    hex: "0849E5",
    rgb: "80, 73, 229",
  },
  {
    name: "purple",
    hex: "9139EA",
    rgb: "145, 57, 234",
  },
  {
    name: "pink",
    hex: "D62D7B",
    rgb: "214, 45, 123",
  },
  {
    name: "orange",
    hex: "EA580B",
    rgb: "234, 88, 11",
  },
  {
    name: "gray",
    hex: "A8A29D",
    rgb: "168, 162, 157",
  },
  {
    name: "grey",
    hex: "A8A29D",
    rgb: "168, 162, 157",
  },
  {
    name: "white",
    hex: "FFFFFF",
    rgb: "255, 255, 255",
  },
  {
    name: "black",
    hex: "000000",
    rgb: "0, 0, 0",
  },
];

export const HTML_COLORS: Array<Color> = [
  // Reds.
  {
    name: "indianred",
    hex: "CD5C5C",
    rgb: "205, 92, 92",
  },
  {
    name: "lightcoral",
    hex: "F08080",
    rgb: "240, 128, 128",
  },
  {
    name: "crimson",
    hex: "DC143C",
    rgb: "220, 20, 60",
  },
  {
    name: "red",
    hex: "FF0000",
    rgb: "255, 0, 0",
  },
  {
    name: "firebrick",
    hex: "B22222",
    rgb: "178, 34, 34",
  },
  {
    name: "darkred",
    hex: "8B0000",
    rgb: "139, 0, 0",
  },

  // Pinks.
  {
    name: "pink",
    hex: "FFC0CB",
    rgb: "255, 192, 203",
  },
  {
    name: "lightpink",
    hex: "FFB6C1",
    rgb: "255, 182, 193",
  },
  {
    name: "hotpink",
    hex: "FF69B4",
    rgb: "255, 105, 180",
  },
  {
    name: "deeppink",
    hex: "FF1493",
    rgb: "255, 20, 147",
  },
  {
    name: "mediumvioletred",
    hex: "C71585",
    rgb: "199, 21, 133",
  },
  {
    name: "palevioletred",
    hex: "DB7093",
    rgb: "219, 112, 147",
  },

  // Oranges.
  {
    name: "salmon",
    hex: "FA8072",
    rgb: "250, 128, 114",
  },
  {
    name: "darksalmon",
    hex: "E9967A",
    rgb: "233, 150, 122",
  },
  {
    name: "lightsalmon",
    hex: "FFA07A",
    rgb: "255, 160, 122",
  },
  {
    name: "coral",
    hex: "FF7F50",
    rgb: "255, 127, 80",
  },
  {
    name: "tomato",
    hex: "FF6347",
    rgb: "255, 99, 71",
  },
  {
    name: "orangered",
    hex: "FF4500",
    rgb: "255, 69, 0",
  },
  {
    name: "darkorange",
    hex: "FF8C00",
    rgb: "255, 140, 0",
  },
  {
    name: "orange",
    hex: "FFA500",
    rgb: "255, 165, 0",
  },

  // Yellows.
  {
    name: "gold",
    hex: "FFD700",
    rgb: "255, 215, 0",
  },
  {
    name: "yellow",
    hex: "FFFF00",
    rgb: "255, 215,0",
  },
  {
    name: "lightyellow",
    hex: "FFFFE0",
    rgb: "255, 255, 224",
  },
  {
    name: "lemonchiffon",
    hex: "FFFACD",
    rgb: "255, 250, 205",
  },
  {
    name: "lightgoldenrodyellow",
    hex: "FAFAD2",
    rgb: "250, 250, 205",
  },
  {
    name: "papayawhip",
    hex: "FFEFD5",
    rgb: "255, 239, 213",
  },
  {
    name: "moccasin",
    hex: "FFE4B5",
    rgb: "255, 228, 181",
  },
  {
    name: "peachpuff",
    hex: "FFDAB9",
    rgb: "255, 218, 185",
  },
  {
    name: "palegoldenrod",
    hex: "EEE8AA",
    rgb: "238, 232, 170",
  },
  {
    name: "khaki",
    hex: "F0E68C",
    rgb: "240, 230, 140",
  },
  {
    name: "darkkhaki",
    hex: "BDB76B",
    rgb: "189, 183, 107",
  },

  // Purples.
  {
    name: "lavender",
    hex: "E6E6FA",
    rgb: "230, 230, 250",
  },
  {
    name: "lavenderhaze",
    hex: "E2D5F1",
    rgb: "226,213,241",
  },
  {
    name: "thistle",
    hex: "D8BFD8",
    rgb: "216, 191, 216",
  },
  {
    name: "plum",
    hex: "DDA0DD",
    rgb: "221, 160, 221",
  },
  {
    name: "violet",
    hex: "EE82EE",
    rgb: "238, 130, 238",
  },
  {
    name: "orchid",
    hex: "DA70D6",
    rgb: "218, 112, 214",
  },
  {
    name: "fuchsia",
    hex: "FF00FF",
    rgb: "255, 0, 255",
  },
  {
    name: "magenta",
    hex: "FF00FF",
    rgb: "255, 0, 255",
  },
  {
    name: "mediumorchid",
    hex: "BA55D3",
    rgb: "186, 85, 211",
  },
  {
    name: "antiheroorchid",
    hex: "B8ACD1",
    rgb: "184,172,209",
  },
  {
    name: "mediumpurple",
    hex: "9370DB",
    rgb: "147, 112, 219",
  },
  {
    name: "rebeccapurple",
    hex: "663399",
    rgb: "102, 51, 153",
  },
  {
    name: "blueviolet",
    hex: "8A2BE2",
    rgb: "138, 43, 226",
  },
  {
    name: "darkviolet",
    hex: "9400D3",
    rgb: "148, 0, 211",
  },
  {
    name: "darkorchid",
    hex: "9932CC",
    rgb: "153, 50, 204",
  },
  {
    name: "darkmagenta",
    hex: "8B008B",
    rgb: "139, 0, 139",
  },
  {
    name: "purple",
    hex: "800080",
    rgb: "128, 0, 128",
  },
  {
    name: "midnightpurple",
    hex: "4E4466",
    rgb: "78,68,102",
  },
  {
    name: "indigo",
    hex: "4B0082",
    rgb: "75, 0, 130",
  },

  // Greens.
  {
    name: "greenyellow",
    hex: "ADFF2F",
    rgb: "173, 255, 47",
  },
  {
    name: "chartreuse",
    hex: "7FFF00",
    rgb: "127, 255, 0",
  },
  {
    name: "lawngreen",
    hex: "7CFC00",
    rgb: "124, 252, 0",
  },
  {
    name: "lime",
    hex: "00FF00",
    rgb: "0, 255, 0",
  },
  {
    name: "limegreen",
    hex: "32CD32",
    rgb: "50, 205, 50",
  },
  {
    name: "palegreen",
    hex: "98FB98",
    rgb: "152, 251, 152",
  },
  {
    name: "lightgreen",
    hex: "90EE90",
    rgb: "144, 238, 144",
  },
  {
    name: "mediumspringgreen",
    hex: "00FA9A",
    rgb: "0, 250, 154",
  },
  {
    name: "springgreen",
    hex: "00FF7F",
    rgb: "0, 255, 127",
  },
  {
    name: "mediumseagreen",
    hex: "3CB371",
    rgb: "60, 179, 113",
  },
  {
    name: "seagreen",
    hex: "2E8B57",
    rgb: "46, 139, 87",
  },
  {
    name: "forestgreen",
    hex: "228B22",
    rgb: "34, 139, 34",
  },
  {
    name: "green",
    hex: "008000",
    rgb: "0, 128, 0",
  },
  {
    name: "darkgreen",
    hex: "006400",
    rgb: "0, 100, 0",
  },
  {
    name: "yellowgreen",
    hex: "9ACD32",
    rgb: "154, 205, 50",
  },
  {
    name: "olivedrab",
    hex: "6B8E23",
    rgb: "107, 142, 35",
  },
  {
    name: "olive",
    hex: "808000",
    rgb: "128, 128, 0",
  },
  {
    name: "darkolivegreen",
    hex: "556B2F",
    rgb: "85, 107, 47",
  },
  {
    name: "mediumaquamarine",
    hex: "66CDAA",
    rgb: "102, 205, 170",
  },
  {
    name: "darkseagreen",
    hex: "8FBC8B",
    rgb: "143, 188, 139",
  },
  {
    name: "lightseagreen",
    hex: "20B2AA",
    rgb: "32, 178, 170",
  },
  {
    name: "darkcyan",
    hex: "008B8B",
    rgb: "0, 139, 139",
  },
  {
    name: "teal",
    hex: "008080",
    rgb: "0, 128, 128",
  },

  // Blues.
  {
    name: "aqua",
    hex: "00FFFF",
    rgb: "0, 255, 255",
  },
  {
    name: "cyan",
    hex: "00FFFF",
    rgb: "0, 255, 255",
  },
  {
    name: "lightcyan",
    hex: "E0FFFF",
    rgb: "224, 255, 255",
  },
  {
    name: "paleturquoise",
    hex: "AFEEEE",
    rgb: "175, 238, 238",
  },
  {
    name: "aquamarine",
    hex: "7FFFD4",
    rgb: "127, 255, 212",
  },
  {
    name: "turquoise",
    hex: "40E0D0",
    rgb: "64, 224, 208",
  },
  {
    name: "mediumturquoise",
    hex: "48D1CC",
    rgb: "72, 209, 204",
  },
  {
    name: "darkturquoise",
    hex: "00CED1",
    rgb: "0, 206, 209",
  },
  {
    name: "cadetblue",
    hex: "5F9EA0",
    rgb: "95, 158, 160",
  },
  {
    name: "steelblue",
    hex: "4682B4",
    rgb: "70, 130, 180",
  },
  {
    name: "lightsteelblue",
    hex: "B0C4DE",
    rgb: "176, 196, 222",
  },
  {
    name: "powderblue",
    hex: "B0C4DE",
    rgb: "176, 224, 230",
  },
  {
    name: "lightblue",
    hex: "ADD8E6",
    rgb: "173, 216, 230",
  },
  {
    name: "skyblue",
    hex: "87CEEB",
    rgb: "135, 206, 235",
  },
  {
    name: "lightskyblue",
    hex: "87CEFA",
    rgb: "135, 206, 250",
  },
  {
    name: "deepskyblue",
    hex: "00BFFF",
    rgb: "0, 191, 255",
  },
  {
    name: "dodgerblue",
    hex: "1E90FF",
    rgb: "30, 144, 255",
  },
  {
    name: "cornflowerblue",
    hex: "6495ED",
    rgb: "100, 149, 237",
  },
  {
    name: "slateblue",
    hex: "6A5ACD",
    rgb: "106, 90, 205",
  },
  {
    name: "darkslateblue",
    hex: "483D8B",
    rgb: "72, 61, 139",
  },
  {
    name: "mediumslateblue",
    hex: "7B68EE",
    rgb: "123, 104, 238",
  },
  {
    name: "royalblue",
    hex: "4169E1",
    rgb: "65, 105, 225",
  },
  {
    name: "blue",
    hex: "0000FF",
    rgb: "0, 0, 255",
  },
  {
    name: "mediumblue",
    hex: "0000CD",
    rgb: "0, 0, 255",
  },
  {
    name: "darkblue",
    hex: "00008B",
    rgb: "0, 0, 139",
  },
  {
    name: "navy",
    hex: "000080",
    rgb: "0, 0, 128",
  },
  {
    name: "midnightblue",
    hex: "191970",
    rgb: "25, 25, 112",
  },

  // Browns.
  {
    name: "cornsilk",
    hex: "FFF8DC",
    rgb: "255, 248, 220",
  },
  {
    name: "blanchedalmond",
    hex: "FFEBCD",
    rgb: "255, 235, 205",
  },
  {
    name: "bisque",
    hex: "FFE4C4",
    rgb: "255, 228, 196",
  },
  {
    name: "navajowhite",
    hex: "FFDEAD",
    rgb: "255, 222, 173",
  },
  {
    name: "wheat",
    hex: "F5DEB3",
    rgb: "245, 222, 179",
  },
  {
    name: "burlywood",
    hex: "DEB887",
    rgb: "222, 184, 135",
  },
  {
    name: "tan",
    hex: "D2B48C",
    rgb: "210, 180, 140",
  },
  {
    name: "rosybrown",
    hex: "BC8F8F",
    rgb: "188, 143, 143",
  },
  {
    name: "sandybrown",
    hex: "F4A460",
    rgb: "244, 164, 96",
  },
  {
    name: "goldenrod",
    hex: "DAA520",
    rgb: "218, 165, 32",
  },
  {
    name: "darkgoldenrod",
    hex: "B8860B",
    rgb: "184, 134, 11",
  },
  {
    name: "peru",
    hex: "CD853F",
    rgb: "205, 133, 63",
  },
  {
    name: "chocolate",
    hex: "D2691E",
    rgb: "210, 105, 30",
  },
  {
    name: "saddlebrown",
    hex: "8B4513",
    rgb: "139, 69, 19",
  },
  {
    name: "sienna",
    hex: "A0522D",
    rgb: "160, 82, 45",
  },
  {
    name: "brown",
    hex: "A52A2A",
    rgb: "165, 42, 42",
  },
  {
    name: "maroon",
    hex: "800000",
    rgb: "128, 0, 0",
  },

  // Whites.
  {
    name: "white",
    hex: "FFFFFF",
    rgb: "255, 255, 255",
  },
  {
    name: "snow",
    hex: "FFFAFA",
    rgb: "255, 250, 250",
  },
  {
    name: "honeydew",
    hex: "F0FFF0",
    rgb: "240, 255, 240",
  },
  {
    name: "mintcream",
    hex: "F5FFFA",
    rgb: "245, 255, 250",
  },
  {
    name: "azure",
    hex: "F0FFFF",
    rgb: "240, 255, 255",
  },
  {
    name: "aliceblue",
    hex: "F0F8FF",
    rgb: "240, 248, 255",
  },
  {
    name: "ghostwhite",
    hex: "F8F8FF",
    rgb: "248, 248, 255",
  },
  {
    name: "whitesmoke",
    hex: "F5F5F5",
    rgb: "245, 245, 245",
  },
  {
    name: "seashell",
    hex: "FFF5EE",
    rgb: "255, 245, 238",
  },
  {
    name: "beige",
    hex: "F5F5DC",
    rgb: "245, 245, 220",
  },
  {
    name: "oldlace",
    hex: "FDF5E6",
    rgb: "253, 245, 230",
  },
  {
    name: "floralwhite",
    hex: "FFFAF0",
    rgb: "255, 250, 240",
  },
  {
    name: "ivory",
    hex: "FFFFF0",
    rgb: "255, 255, 240",
  },
  {
    name: "antiquewhite",
    hex: "FAEBD7",
    rgb: "250, 235, 215",
  },
  {
    name: "linen",
    hex: "FAF0E6",
    rgb: "250, 240, 230",
  },
  {
    name: "lavenderblush",
    hex: "FFF0F5",
    rgb: "255, 240, 245",
  },
  {
    name: "mistyrose",
    hex: "FFE4E1",
    rgb: "255, 228, 225",
  },

  // Greys.
  {
    name: "gainsboro",
    hex: "DCDCDC",
    rgb: "220, 220, 220",
  },
  {
    name: "lightgray",
    hex: "D3D3D3",
    rgb: "211, 211, 211",
  },
  {
    name: "lightgrey",
    hex: "D3D3D3",
    rgb: "211, 211, 211",
  },
  {
    name: "silver",
    hex: "C0C0C0",
    rgb: "192, 192, 192",
  },
  {
    name: "darkgray",
    hex: "A9A9A9",
    rgb: "169, 169, 169",
  },
  {
    name: "darkgrey",
    hex: "A9A9A9",
    rgb: "169, 169, 169",
  },
  {
    name: "gray",
    hex: "808080",
    rgb: "128, 128, 128",
  },
  {
    name: "grey",
    hex: "808080",
    rgb: "128, 128, 128",
  },
  {
    name: "dimgray",
    hex: "696969",
    rgb: "105, 105, 105",
  },
  {
    name: "dimgrey",
    hex: "696969",
    rgb: "105, 105, 105",
  },
  {
    name: "lightslategray",
    hex: "105, 105, 105",
    rgb: "105, 105, 105",
  },
  {
    name: "lightslategrey",
    hex: "105, 105, 105",
    rgb: "105, 105, 105",
  },
  {
    name: "slategray",
    hex: "708090",
    rgb: "112, 128, 144",
  },
  {
    name: "slategrey",
    hex: "708090",
    rgb: "112, 128, 144",
  },
  {
    name: "darkslategray",
    hex: "2F4F4F",
    rgb: "47, 79, 79",
  },
  {
    name: "darkslategrey",
    hex: "2F4F4F",
    rgb: "47, 79, 79",
  },
  {
    name: "black",
    hex: "000000",
    rgb: "0, 0, 0",
  },
];
export const HTML_COLORS_MAP: Map<string, Color> = HTML_COLORS.reduce(
  (map, item) => { map.set(item.name, item); return map; },
  new Map<string, Color>(),
);

export const HUMAN_COLORS: Array<Color> = HTML_COLORS.concat(MARKWHEN_COLORS);
export const HUMAN_COLORS_MAP: Map<string, Color> = HUMAN_COLORS.reduce(
  (map, item) => { map.set(item.name, item); return map; },
  new Map<string, Color>(),
);

export function hexToRgb(hex: string): string | undefined {
  hex = hex.replace("#", "");
  const isShortHex = hex.length === 3;
  var r = parseInt(
    isShortHex ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2),
    16
  );
  if (isNaN(r)) {
    return undefined;
  }
  var g = parseInt(
    isShortHex ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4),
    16
  );
  if (isNaN(g)) {
    return undefined;
  }
  var b = parseInt(
    isShortHex ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6),
    16
  );
  if (isNaN(b)) {
    return undefined;
  }
  return `${r}, ${g}, ${b}`;
}

function componentToHex(c: number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbNumberToHex(...rgb: number[]) {
  return (
    "#" +
    componentToHex(rgb[0]) +
    componentToHex(rgb[1]) +
    componentToHex(rgb[2])
  );
}

export function rgbStringToHex(s: string) {
  return rgbNumberToHex(...s.split(",").map((n) => parseInt(n.trim())));
}

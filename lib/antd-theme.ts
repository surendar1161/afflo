/**
 * FreshAffiliates Design System — Freshworks Crayons Light Theme
 *
 * Color palette matches Freshworks product suite (Freshdesk, Freshsales, etc.)
 * Primary:  #2C5CC5  (Crayons Azure Blue)
 * Success:  #00875A  (Crayons Jungle Green)
 * Warning:  #E86E0A  (Crayons Papaya)
 * Danger:   #D72D30  (Crayons Persimmon)
 * Bg:       #f5f7f9  (Crayons Smoke 50)
 * Surface:  #ffffff
 * Text:     #12344d  (Crayons Elephant 900)
 */
import type { ThemeConfig } from "antd";

const FW = {
  // Freshworks Crayons Blue (primary)
  blue50:   "#ebf0fb",
  blue100:  "#c5d4f5",
  blue200:  "#8aaae9",
  blue400:  "#4a78d0",
  blue500:  "#2C5CC5",   // ← primary
  blue600:  "#1a4aad",
  blue700:  "#0d3490",

  // Freshworks Crayons Green (success)
  green50:  "#e0f5ed",
  green500: "#00875A",   // ← success
  green600: "#006644",

  // Freshworks Crayons Papaya (warning)
  amber500: "#E86E0A",

  // Freshworks Crayons Persimmon (danger)
  red500:   "#D72D30",

  // Freshworks Crayons Smoke / Elephant (neutral)
  bg:       "#f5f7f9",   // page background (Smoke 50)
  surface:  "#ffffff",   // card/panel surface
  surface2: "#f8fafc",   // slightly elevated
  surface3: "#f0f3f7",   // dropdown/modal

  // Text (Freshworks Elephant palette)
  text900:  "#12344d",   // primary text
  text700:  "#475867",   // secondary
  text500:  "#8fa0b4",   // tertiary / placeholder
  text300:  "#a0b0c0",   // disabled / muted

  // Borders (Freshworks Crayons border tokens)
  border:   "#cdd7e0",   // default border
  borderSm: "#e2e8f0",   // subtle
  borderXs: "#edf0f4",   // very subtle
} as const;

export const antdTheme: ThemeConfig = {
  token: {
    // ── Core colors ───────────────────────────────────────────────────────
    colorPrimary:         FW.blue500,
    colorSuccess:         FW.green500,
    colorWarning:         FW.amber500,
    colorError:           FW.red500,
    colorInfo:            FW.blue500,

    // ── Backgrounds ───────────────────────────────────────────────────────
    colorBgBase:          FW.surface,
    colorBgContainer:     FW.surface,
    colorBgElevated:      FW.surface,
    colorBgLayout:        FW.bg,
    colorBgSpotlight:     FW.surface3,

    // ── Borders ───────────────────────────────────────────────────────────
    colorBorder:          FW.border,
    colorBorderSecondary: FW.borderSm,

    // ── Text ──────────────────────────────────────────────────────────────
    colorText:            FW.text900,
    colorTextSecondary:   FW.text700,
    colorTextTertiary:    FW.text500,
    colorTextQuaternary:  FW.text300,
    colorTextDisabled:    FW.text300,

    // ── Fill ──────────────────────────────────────────────────────────────
    colorFill:            "rgba(18,52,77,0.06)",
    colorFillSecondary:   "rgba(18,52,77,0.04)",
    colorFillTertiary:    "rgba(18,52,77,0.03)",
    colorFillQuaternary:  "rgba(18,52,77,0.02)",

    // ── Freshworks border radius ──────────────────────────────────────────
    borderRadius:         6,
    borderRadiusLG:       8,
    borderRadiusSM:       4,
    borderRadiusXS:       2,

    // ── Typography (Inter matches Freshworks) ─────────────────────────────
    fontSize:             14,
    fontSizeSM:           12,
    fontSizeLG:           16,
    fontSizeXL:           20,
    fontSizeHeading1:     28,
    fontSizeHeading2:     22,
    fontSizeHeading3:     18,
    fontSizeHeading4:     16,
    fontSizeHeading5:     14,
    fontFamily:           "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeightStrong:     600,
    lineHeight:           1.5714,

    // ── Elevation (Freshworks: subtle shadows on white) ───────────────────
    boxShadow:            "0 1px 3px rgba(12,52,77,0.08), 0 1px 2px rgba(12,52,77,0.06)",
    boxShadowSecondary:   "0 4px 8px rgba(12,52,77,0.10), 0 2px 4px rgba(12,52,77,0.06)",
    boxShadowTertiary:    "0 10px 24px rgba(12,52,77,0.12), 0 4px 8px rgba(12,52,77,0.08)",

    // ── Control sizing ────────────────────────────────────────────────────
    controlHeight:        36,
    controlHeightLG:      40,
    controlHeightSM:      28,
    lineWidth:            1,

    // ── Spacing ───────────────────────────────────────────────────────────
    padding:     16,
    paddingXS:   8,
    paddingSM:   12,
    paddingLG:   24,
    paddingXL:   32,
    margin:      16,
    marginXS:    8,
    marginSM:    12,
    marginLG:    24,
    marginXL:    32,
  },

  components: {
    // ── Button ────────────────────────────────────────────────────────────
    Button: {
      primaryColor:       "#fff",
      primaryShadow:      "none",
      defaultShadow:      "none",
      dangerShadow:       "none",
      defaultBg:          "#ffffff",
      defaultBorderColor: FW.border,
      defaultColor:       FW.text900,
      borderRadius:       6,
      controlHeight:      36,
      paddingInline:      16,
      fontSize:           14,
      fontWeight:         600,
    },

    // ── Input ─────────────────────────────────────────────────────────────
    Input: {
      colorBgContainer:     FW.surface,
      colorBorder:          FW.border,
      colorText:            FW.text900,
      colorTextPlaceholder: FW.text500,
      activeShadow:         `0 0 0 3px rgba(44,92,197,0.12)`,
      activeBorderColor:    FW.blue500,
      hoverBorderColor:     FW.blue400,
      borderRadius:         6,
      controlHeight:        36,
      fontSize:             14,
    },

    // ── Select ────────────────────────────────────────────────────────────
    Select: {
      colorBgContainer:    FW.surface,
      colorBgElevated:     FW.surface,
      colorBorder:         FW.border,
      colorText:           FW.text900,
      optionSelectedBg:    FW.blue50,
      optionSelectedColor: FW.blue500,
      optionActiveBg:      FW.bg,
      selectorBg:          FW.surface,
      borderRadius:        6,
      controlHeight:       36,
    },

    // ── Table ─────────────────────────────────────────────────────────────
    Table: {
      colorBgContainer:    FW.surface,
      headerBg:            "#f8fafc",
      headerColor:         FW.text700,
      headerSortActiveBg:  FW.blue50,
      rowHoverBg:          "#f5f8ff",
      borderColor:         FW.borderSm,
      colorText:           FW.text900,
      headerSplitColor:    FW.borderSm,
      cellPaddingBlock:    12,
      cellPaddingInline:   20,
      headerBorderRadius:  0,
      fontSize:            14,
    },

    // ── Card ──────────────────────────────────────────────────────────────
    Card: {
      colorBgContainer:    FW.surface,
      colorBorderSecondary:FW.borderSm,
      borderRadius:        8,
      paddingLG:           20,
      boxShadowTertiary:   "0 1px 3px rgba(12,52,77,0.08)",
    },

    // ── Modal ─────────────────────────────────────────────────────────────
    Modal: {
      colorBgElevated:     FW.surface,
      borderRadius:        8,
    },

    // ── Menu (sidebar nav) ────────────────────────────────────────────────
    Menu: {
      // Light mode (not dark)
      itemBg:               FW.surface,
      itemHoverBg:          FW.bg,
      itemSelectedBg:       FW.blue50,
      itemColor:            FW.text700,
      itemHoverColor:       FW.text900,
      itemSelectedColor:    FW.blue500,
      subMenuItemBg:        FW.surface,
      itemActiveBg:         FW.blue50,
      itemBorderRadius:     6,
      itemHeight:           36,
      iconSize:             16,
      collapsedIconSize:    18,
      itemPaddingInline:    16,
      fontSize:             14,
      // Dark versions (portal may use dark sidebar)
      darkItemBg:           "#1c2b4a",
      darkItemHoverBg:      "rgba(44,92,197,0.15)",
      darkItemSelectedBg:   "rgba(44,92,197,0.25)",
      darkItemColor:        "#8fa0b4",
      darkItemHoverColor:   "#f0f4ff",
      darkItemSelectedColor:"#ffffff",
    },

    // ── Layout ────────────────────────────────────────────────────────────
    Layout: {
      siderBg:   FW.surface,
      headerBg:  FW.surface,
      bodyBg:    FW.bg,
    },

    // ── Tabs ──────────────────────────────────────────────────────────────
    Tabs: {
      colorBgContainer:    "transparent",
      inkBarColor:         FW.blue500,
      itemColor:           FW.text700,
      itemHoverColor:      FW.text900,
      itemSelectedColor:   FW.blue500,
      itemActiveColor:     FW.blue500,
      titleFontSize:       14,
      horizontalItemPadding: "10px 0",
    },

    // ── Form ──────────────────────────────────────────────────────────────
    Form: {
      labelColor:          FW.text700,
      labelFontSize:       13,
      labelHeight:         32,
      itemMarginBottom:    20,
      verticalLabelPadding:"0 0 6px",
    },

    // ── Tag / Badge ───────────────────────────────────────────────────────
    Tag: {
      defaultBg:    FW.bg,
      defaultColor: FW.text700,
      borderRadius: 24,
      fontSize:     11,
      fontSizeSM:   11,
    },

    // ── Statistic ─────────────────────────────────────────────────────────
    Statistic: {
      colorTextDescription: FW.text700,
      titleFontSize:        12,
      contentFontSize:      24,
    },

    // ── Divider ───────────────────────────────────────────────────────────
    Divider: { colorSplit: FW.borderSm },

    // ── Tooltip ───────────────────────────────────────────────────────────
    Tooltip: {
      colorBgSpotlight: "#12344d",
      colorTextLightSolid: "#ffffff",
      borderRadius: 4,
    },

    // ── Dropdown ──────────────────────────────────────────────────────────
    Dropdown: {
      colorBgElevated: FW.surface,
      borderRadius:    8,
      paddingBlock:    6,
      colorText:       FW.text900,
    },

    // ── Alert ─────────────────────────────────────────────────────────────
    Alert: { borderRadius: 6 },

    // ── Segmented ─────────────────────────────────────────────────────────
    Segmented: {
      colorBgLayout:     FW.borderXs,
      itemSelectedBg:    FW.surface,
      itemSelectedColor: FW.text900,
      itemColor:         FW.text700,
      borderRadius:      6,
      trackPadding:      2,
    },

    // ── Progress ──────────────────────────────────────────────────────────
    Progress: {
      defaultColor:    FW.blue500,
      remainingColor:  FW.borderXs,
    },

    // ── Popover ───────────────────────────────────────────────────────────
    Popover: {
      colorBgElevated: FW.surface,
      borderRadius:    8,
    },

    // ── Steps ─────────────────────────────────────────────────────────────
    Steps: {
      colorPrimary: FW.blue500,
      dotSize:      8,
    },

    // ── Switch ────────────────────────────────────────────────────────────
    Switch: {
      colorPrimary: FW.blue500,
      handleBg:     "#fff",
    },

    // ── Badge ─────────────────────────────────────────────────────────────
    Badge: {
      colorBgContainer: FW.blue500,
      borderRadius:     24,
      fontSize:         11,
    },

    // ── Avatar ────────────────────────────────────────────────────────────
    Avatar: { colorBgBase: FW.blue50 },

    // ── Empty ─────────────────────────────────────────────────────────────
    Empty: { colorTextDescription: FW.text500 },

    // ── Pagination ────────────────────────────────────────────────────────
    Pagination: { itemSize: 32, borderRadius: 6 },

    // ── DatePicker ────────────────────────────────────────────────────────
    DatePicker: {
      colorBgContainer:     FW.surface,
      colorBorder:          FW.border,
      colorText:            FW.text900,
      colorTextPlaceholder: FW.text500,
      activeBorderColor:    FW.blue500,
      borderRadius:         6,
    },
  },

  algorithm: [],
};

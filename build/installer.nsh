; ============================================================================
; CORVUS // EAW MODDING TOOL - CUSTOM DARK TACTICAL HUD NSIS SCRIPT (v3.1.3)
; ============================================================================

!macro customHeader
  !ifdef MUI_BGCOLOR
    !undef MUI_BGCOLOR
  !endif
  !define MUI_BGCOLOR "020617"

  !ifdef MUI_TEXTCOLOR
    !undef MUI_TEXTCOLOR
  !endif
  !define MUI_TEXTCOLOR "E2E8F0"

  !ifdef MUI_LICENSEPAGE_BGCOLOR
    !undef MUI_LICENSEPAGE_BGCOLOR
  !endif
  !define MUI_LICENSEPAGE_BGCOLOR "0F172A"

  BrandingText "CORVUS // GALACTIC ENGINE v3.1.3 - TACTICAL SETUP"
!macroend

!macro customInstall
  WriteRegStr SHCTX "Software\CORVUS\ModdingTool" "Version" "3.1.3"
  WriteRegStr SHCTX "Software\CORVUS\ModdingTool" "Engine" "Alamo-EAW-FoC"
  WriteRegStr SHCTX "Software\CORVUS\ModdingTool" "Theme" "Tactical-HUD-Dark"
!macroend

!macro customUnInstall
  DeleteRegKey SHCTX "Software\CORVUS"
!macroend

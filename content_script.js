// Save original title once per URL
if (!sessionStorage.getItem("_tab_namer_orig")) {
  sessionStorage.setItem("_tab_namer_orig", document.title);
}

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL(path,import.meta.url),"utf8");
const visual=read("../components/landing/ServiceVisual.tsx");
const home=read("../components/landing/LandingPage.tsx");
const maya=read("../components/landing/MayaLandingPage.tsx");
const tools=read("../components/landing/ToolLandingPage.tsx");

test("cards institucionais compartilham visuais vetoriais responsivos",()=>{
  for(const variant of ["crm","ai","chat","workflow","integration","insight"])
    assert.match(visual,new RegExp(`variant===\\"${variant}\\"`));
  assert.match(home,/ServiceVisual label=\{title\}/);
  assert.match(maya,/ServiceVisual label=\{title\}/);
  assert.match(maya,/ServiceVisual label=\{module\}/);
  assert.match(tools,/ServiceVisual label=\{service\.title\}/);
  assert.match(visual,/aria-hidden="true"/);
});

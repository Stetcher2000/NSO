"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Mode = "generate" | "edit";

export default function Home() {
  const [mode, setMode] = useState<Mode>("generate");
  const [prompt, setPrompt] = useState("");
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (sourcePreview.startsWith("blob:")) URL.revokeObjectURL(sourcePreview);
    };
  }, [sourcePreview]);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setResult("");
  }

  function onChooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Please choose an image smaller than 20 MB.");
      return;
    }
    setSourceImage(file);
    setSourcePreview(URL.createObjectURL(file));
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResult("");

    if (!prompt.trim()) {
      setError("Describe the image you want.");
      return;
    }
    if (mode === "edit" && !sourceImage) {
      setError("Upload a photo to edit first.");
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("prompt", prompt.trim());
      if (mode === "edit" && sourceImage) body.append("image", sourceImage);

      const response = await fetch(mode === "generate" ? "/api/generate" : "/api/edit", {
        method: "POST",
        body
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Image generation failed.");
      setResult(`data:image/png;base64,${data.image}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function downloadResult() {
    if (!result) return;
    const link = document.createElement("a");
    link.href = result;
    link.download = "prompt-photo.png";
    link.click();
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">✳</span> Prompt Photo Studio</a>
        <span className="private-label">Your creative workspace</span>
      </header>

      <section className="intro">
        <p className="eyebrow">AI IMAGE WORKSPACE</p>
        <h1>Imagine it.<br /><span>Bring it to life.</span></h1>
        <p className="subhead">Create a brand-new image from a prompt, or upload a photo and describe how you want to change it.</p>
      </section>

      <section className="workspace">
        <div className="tabs" role="tablist" aria-label="Image mode">
          <button className={mode === "generate" ? "tab active" : "tab"} onClick={() => switchMode("generate")} role="tab" aria-selected={mode === "generate"}>
            <span>✦</span> Generate image
          </button>
          <button className={mode === "edit" ? "tab active" : "tab"} onClick={() => switchMode("edit")} role="tab" aria-selected={mode === "edit"}>
            <span>◩</span> Edit a photo
          </button>
        </div>

        <form className="composer" onSubmit={submit}>
          {mode === "edit" && (
            <div className="upload-area">
              <input id="photo-upload" type="file" accept="image/*" onChange={onChooseImage} />
              <label htmlFor="photo-upload" className="upload-label">
                {sourcePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sourcePreview} alt="Selected photo preview" className="source-preview" />
                ) : (
                  <>
                    <span className="upload-icon">↑</span>
                    <strong>Choose a photo from your device</strong>
                    <span>Tap to browse your gallery or files · PNG, JPG, WEBP · max 20 MB</span>
                  </>
                )}
              </label>
              {sourceImage && <button type="button" className="text-button" onClick={() => { setSourceImage(null); setSourcePreview(""); }}>Remove photo</button>}
            </div>
          )}

          <label className="prompt-label" htmlFor="prompt">{mode === "generate" ? "Describe the image you want" : "Describe the edit you want"}</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={mode === "generate"
              ? "A realistic photo of a cold Pepsi can resting on the hood of a vintage sports car at sunset..."
              : "Add a person sledding down the mountain. Keep the original landscape, lighting, and camera angle consistent..."}
            rows={4}
          />
          <div className="composer-footer">
            <span className="hint">{mode === "generate" ? "Tip: include subject, setting, lighting, and style." : "Be specific about what to add, remove, or change."}</span>
            <button className="generate-button" type="submit" disabled={busy}>
              {busy ? <><span className="spinner" /> Creating…</> : <>{mode === "generate" ? "Generate image" : "Apply edit"} <span>↗</span></>}
            </button>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
        </form>

        <section className="result-panel" aria-live="polite">
          <div className="result-heading">
            <div><p className="eyebrow">CANVAS</p><h2>Your result</h2></div>
            {result && <button className="download-button" onClick={downloadResult}>↓ Download PNG</button>}
          </div>
          {busy ? (
            <div className="empty-state generating"><span className="big-spinner" /><strong>Making your image</strong><span>This can take a little while.</span></div>
          ) : result ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="result-image" src={result} alt="AI-generated result" />
          ) : (
            <div className="empty-state">
              <div className="empty-art"><span>✦</span><span>◌</span><span>✧</span></div>
              <strong>Your next idea starts here</strong>
              <span>Your generated image will appear in this space.</span>
            </div>
          )}
        </section>
      </section>
      <footer><span>Prompt Photo Studio</span><span>Built for creative exploration</span></footer>
    </main>
  );
}

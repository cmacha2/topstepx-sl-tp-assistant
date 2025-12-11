# Quick Publish Guide - 5 Steps to Chrome Web Store

## 🚀 Fast Track (30 minutes + review time)

### Step 1: Create Build Package (2 minutes)

```bash
# Run build script
./build-store.sh

# This creates: topstepx-sltp-assistant-v4.4.1.zip
```

### Step 2: Create Developer Account (15 minutes)

1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Pay $5 registration fee (one-time)
4. Complete developer profile

### Step 3: Host Privacy Policy (5 minutes)

**Option A: GitHub Pages (Recommended)**
```bash
# Create docs folder
mkdir docs
cp PRIVACY-POLICY.md docs/privacy.md

# Push to GitHub
git add docs/
git commit -m "Add privacy policy"
git push

# Enable GitHub Pages:
# Go to repo Settings → Pages
# Source: main branch, /docs folder
# URL will be: https://cmacha2.github.io/topstepx-sl-tp-assistant/privacy
```

**Option B: Create Google Doc**
1. Copy PRIVACY-POLICY.md content
2. Create new Google Doc
3. File → Publish to web → Get link

### Step 4: Take Screenshots (10 minutes)

Need 3-5 screenshots (1280x800 or 640x400):

1. **Extension Popup** - Open extension, screenshot all settings
2. **Lines on Chart** - Create order on TopstepX, show SL/TP lines
3. **Customization** - Show color/style options
4. **Live Example** - Real chart with lines and dollar amounts
5. **Multiple Contracts** - Order with 2+ contracts showing values

**Quick Screenshot:**
- Mac: Cmd+Shift+4
- Windows: Win+Shift+S
- Resize to 1280x800 if needed

### Step 5: Submit (10 minutes)

1. **Upload ZIP:**
   - Go to: https://chrome.google.com/webstore/devconsole
   - Click "New Item"
   - Upload: topstepx-sltp-assistant-v4.4.1.zip

2. **Fill Basic Info:**
   ```
   Name: TopstepX SL/TP Assistant
   Summary: Automatic Stop Loss and Take Profit visualization for TopstepX traders
   ```

3. **Add Description:**
   ```markdown
   Transform your TopstepX trading with automatic SL/TP lines and real-time dollar values.
   
   KEY FEATURES:
   ✅ Automatic line placement on limit/stop orders
   ✅ Real-time dollar amounts
   ✅ Fully customizable (colors, styles, text)
   ✅ Works with LONG and SHORT positions
   ✅ No data collection - 100% private
   
   DISCLAIMER: Visual tool only. Not financial advice. Trading involves risk.
   ```

4. **Upload Screenshots:**
   - Drag and drop 3-5 screenshots

5. **Set Privacy:**
   ```
   Privacy Policy URL: [Your GitHub Pages or Google Doc URL]
   
   Single Purpose: Visual Stop Loss and Take Profit lines for TopstepX charts
   
   Permissions:
   - storage: Save user preferences locally
   - activeTab: Access TopstepX charts
   - scripting: Draw visual lines on charts
   ```

6. **Distribution:**
   - Visibility: Public
   - Pricing: Free
   - Countries: All countries

7. **Click "Submit for Review"** 🎉

---

## ⏱️ Timeline

- **Your work:** 30-40 minutes
- **Google review:** 1-7 days (usually 2-3 days)
- **Total:** Usually approved within 3 days

---

## ✅ Pre-Submission Checklist

Quick verification before submitting:

- [ ] Build script ran successfully
- [ ] ZIP file created (check size: should be ~500KB)
- [ ] Privacy policy hosted and accessible
- [ ] 3-5 screenshots prepared
- [ ] Chrome Developer account created ($5 paid)
- [ ] All disclaimers added to description

---

## 🎯 After Approval

Once approved (you'll get email):

1. **Get extension URL:**
   ```
   https://chrome.google.com/webstore/detail/[extension-id]
   ```

2. **Update README.md:**
   ```markdown
   ## Installation
   
   [Install from Chrome Web Store](https://chrome.google.com/webstore/detail/[id])
   ```

3. **Share:**
   - Post on Twitter/Reddit
   - Share in trading communities
   - Add to your GitHub profile

---

## 💡 Pro Tips

1. **Good Screenshots = Higher Downloads**
   - Use clear, high-resolution images
   - Show the extension in action
   - Add text labels if helpful

2. **Clear Description = Less Questions**
   - Be specific about features
   - Include disclaimers upfront
   - Mention "TopstepX" for searchability

3. **Fast Approval**
   - Accurate permission justifications
   - Clear privacy policy
   - Professional presentation

---

## 🐛 Troubleshooting

### "Rejected: Missing Privacy Policy"
→ Make sure URL is publicly accessible

### "Rejected: Excessive Permissions"  
→ Our extension is fine, this shouldn't happen

### "Rejected: Misleading Description"
→ Add more disclaimers about trading risks

### "Pending Review Too Long"
→ Usually reviews are 2-3 days, up to 7 days is normal

---

## 📞 Need Help?

- Full guide: See `CHROME-STORE-GUIDE.md`
- Chrome Web Store Help: https://developer.chrome.com/docs/webstore/
- Extension issues: GitHub Issues

---

**Ready to publish? Run `./build-store.sh` and let's go!** 🚀


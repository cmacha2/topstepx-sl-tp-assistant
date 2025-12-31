# Chrome Web Store Submission Guide
## TopstepX SL/TP Assistant v4.5.5

---

## ✅ Pre-Submission Checklist

### 1. Extension Package
- [x] manifest.json updated to v4.5.5
- [x] All required icons present (16x16, 48x48, 128x128)
- [x] Privacy Policy created and accessible
- [x] LICENSE file included (MIT)
- [x] README.md updated with current version
- [x] Build script ready (`build-store.sh`)

### 2. Code Quality
- [x] No hardcoded API keys or secrets
- [x] No eval() or remote code execution
- [x] Proper permission justifications
- [x] Content Security Policy compliant
- [x] Works with Manifest V3

### 3. Documentation
- [x] Clear description of functionality
- [x] Privacy policy compliant with Chrome policies
- [x] Proper disclaimers about trading risks
- [x] Installation instructions
- [x] User guide and troubleshooting

---

## 📝 Store Listing Information

### Basic Information

**Extension Name:**
```
TopstepX SL/TP Assistant
```

**Short Description** (132 characters max):
```
Visual Stop Loss and Take Profit lines with automatic risk calculation for TopstepX traders
```
(98 characters)

**Detailed Description:**

```
TopstepX SL/TP Assistant is a powerful Chrome extension designed specifically for TopstepX traders who want to visualize their risk and potential profit in real-time.

KEY FEATURES:

✅ Automatic Line Placement
- Lines appear instantly when you place limit or stop orders
- No manual configuration needed
- Works seamlessly with TopstepX charts

📊 Dynamic Value Updates
- Dollar amounts update in real-time as you drag orders
- See your exact profit and loss potential
- Contract quantity displayed on labels

🎨 Fully Customizable
- Choose your own colors for Stop Loss and Take Profit lines
- Adjust line width (1-10px) for visibility
- Minimalist design that doesn't clutter your charts

🔄 Real-Time Synchronization
- Lines follow your order modifications automatically
- Disappear when orders are cancelled or executed
- Persist across page reloads (optional)

💰 Smart Risk Management
- Configure default SL/TP values
- Set risk as percentage of account or fixed dollar amount
- Auto-calculate Take Profit using risk:reward ratios

🎯 Intelligent Order Detection
- Supports LONG and SHORT positions
- Works with Limit Orders, Stop Orders, and Market Orders
- Automatically determines correct line placement

SUPPORTED ORDER TYPES:
- Limit Buy/Sell (LONG/SHORT)
- Stop Buy/Sell (LONG/SHORT)
- Market Orders (instant execution tracking)

HOW IT WORKS:

1. Open a chart on TopstepX
2. Place a limit or stop order
3. Red Stop Loss and Green Take Profit lines appear automatically
4. Drag orders to modify - lines update instantly
5. Cancel orders - lines disappear

VISUAL INDICATORS:
- Stop Loss Line (Red) - Shows potential loss with label "SL -$100 (1x)"
- Take Profit Line (Green) - Shows potential profit with label "TP +$200 (1x)"

PRIVACY & SECURITY:
- NO data collection - completely private
- All settings stored locally on your device
- No external API calls or tracking
- Open source code available for review
- Compliant with GDPR and CCPA

SUPPORTED INSTRUMENTS:
All TopstepX futures contracts including:
- Micro E-mini: MES, MNQ, M2K, MYM
- E-mini: ES, NQ, RTY, YM
- Crude Oil: CL, MCL
- And many more...

DISCLAIMER:
This extension is a VISUAL TOOL ONLY. It does not:
- Provide financial advice
- Guarantee trading profits
- Automatically execute trades
- Replace proper risk management

Trading involves substantial risk of loss. Always verify your levels before trading.

NOT AFFILIATED with TopstepX or TradingView. All trademarks belong to their respective owners.

Perfect for traders who want clearer visualization of their risk management strategy on TopstepX!
```

**Category:**
```
Productivity
```

**Language:**
```
English
```

---

## 🎨 Visual Assets Required

### 1. Extension Icons (Already Created ✅)
- ✅ 16x16px - `assets/icons/icon16.png`
- ✅ 48x48px - `assets/icons/icon48.png`
- ✅ 128x128px - `assets/icons/icon128.png`

### 2. Store Listing Images (NEED TO CREATE)

#### Small Tile Icon (Required)
- **Size:** 128x128px
- **Format:** PNG
- **Purpose:** Shown in search results
- **File:** Use existing `assets/icons/icon128.png`

#### Large Promo Tile (Recommended)
- **Size:** 440x280px
- **Format:** PNG or JPEG
- **Purpose:** Featured placements
- **Content:** Extension logo + tagline
- **Status:** ⚠️ NEED TO CREATE

#### Marquee Promo Tile (Optional)
- **Size:** 1400x560px
- **Format:** PNG or JPEG
- **Purpose:** Top of store page
- **Status:** ⚠️ OPTIONAL (can skip for now)

#### Screenshots (Required - At least 1, max 5)
- **Size:** 1280x800px or 640x400px
- **Format:** PNG or JPEG
- **Purpose:** Show extension in action
- **Status:** ⚠️ NEED TO CREATE

**Recommended Screenshots:**
1. Extension popup with configuration settings
2. Chart with Stop Loss and Take Profit lines visible
3. Order entry with lines appearing automatically
4. Line labels showing dollar values
5. Before/after comparison

---

## 🔐 Privacy & Permissions

### Permissions Justification

**storage**
- Purpose: Save user configuration preferences locally
- Data: Colors, line width, risk settings
- Scope: Local device only, never transmitted

**activeTab**
- Purpose: Access TopstepX.com charts to display visual lines
- Data: Chart display area only
- Scope: Only when user is on TopstepX.com

**scripting**
- Purpose: Inject visual elements (lines and labels) into charts
- Data: Chart rendering only
- Scope: Limited to visual display, no data collection

**host_permissions: https://topstepx.com/***
- Purpose: Access TopstepX charts to draw Stop Loss and Take Profit lines
- Data: Chart interaction only
- Scope: Only TopstepX.com domain

**host_permissions: https://*.tradingview.com/***
- Purpose: Access TradingView chart widgets embedded in TopstepX
- Data: Chart API access for line rendering
- Scope: Read-only access to chart API

### Data Usage Disclosure

```
This extension does NOT:
- Collect personal information
- Track user behavior
- Send data to external servers
- Use analytics or telemetry
- Access trading account data
- Store any financial information
- Use cookies or trackers

All settings are stored locally using Chrome's storage API and never leave your device.
```

---

## 📋 Submission Steps

### 1. Create Developer Account
1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Pay one-time $5 developer registration fee
4. Verify email address

### 2. Build Extension Package
```bash
chmod +x build-store.sh
./build-store.sh
```

This creates: `topstepx-sltp-assistant-v4.5.5.zip`

### 3. Upload to Chrome Web Store

1. **Go to Developer Dashboard**
   - https://chrome.google.com/webstore/devconsole

2. **Click "New Item"**

3. **Upload ZIP file**
   - Upload `topstepx-sltp-assistant-v4.5.5.zip`

4. **Fill Store Listing**
   - Product name: TopstepX SL/TP Assistant
   - Summary: (Use short description above)
   - Detailed description: (Use detailed description above)
   - Category: Productivity
   - Language: English

5. **Upload Images**
   - Small tile icon: `assets/icons/icon128.png`
   - Screenshots: (Upload 2-5 screenshots)
   - Large promo tile: (Optional but recommended)

6. **Privacy**
   - Single purpose: "Visual trading assistant for TopstepX"
   - Host permissions justification: (See above)
   - Remote code: No
   - Data usage: Does not collect user data

7. **Pricing & Distribution**
   - Price: Free
   - Countries: All countries (or select specific)
   - Visibility: Public

8. **Submit for Review**
   - Click "Submit for review"
   - Review typically takes 1-3 business days

---

## 🎯 Single Purpose Justification

**Primary Purpose:**
```
Visual trading assistant that displays Stop Loss and Take Profit lines on TopstepX charts for risk management
```

**How it achieves this:**
- Detects order placement on TopstepX
- Calculates appropriate SL/TP levels based on user settings
- Draws visual lines with dollar value labels on charts
- Updates lines dynamically when orders are modified
- Removes lines when orders are cancelled

**Why permissions are needed:**
- `storage`: Save user preferences for line colors and risk settings
- `activeTab` + `scripting`: Draw visual lines on TopstepX charts
- `host_permissions`: Access TopstepX and TradingView chart APIs

---

## ⚠️ Common Rejection Reasons (and how we avoid them)

### 1. Unclear Single Purpose
✅ **We have clear single purpose:** Visual risk management lines for TopstepX traders

### 2. Excessive Permissions
✅ **We only request necessary permissions:** storage, activeTab, scripting, specific host permissions

### 3. Missing Privacy Policy
✅ **We have comprehensive privacy policy:** See PRIVACY-POLICY.md

### 4. Obfuscated Code
✅ **All code is readable and well-documented:** No minification, clear variable names

### 5. User Data Collection
✅ **We don't collect any user data:** Everything is local storage only

### 6. Misleading Description
✅ **Clear disclaimers:** Not financial advice, no guaranteed profits, visual tool only

### 7. Trademark Issues
✅ **Clear disclaimer:** Not affiliated with TopstepX or TradingView

### 8. Missing Functionality Description
✅ **Detailed documentation:** README, configuration guide, usage instructions

---

## 📊 Post-Submission

### Expected Timeline
- **Submission:** Day 0
- **Initial Review:** 1-3 business days
- **Follow-up (if needed):** 1-2 business days
- **Total:** Usually 2-5 business days

### If Rejected
1. Read rejection reason carefully
2. Make required changes
3. Update version number (e.g., 4.5.6)
4. Rebuild and resubmit
5. Respond to reviewer comments if needed

### After Approval
1. Extension goes live immediately
2. Update README with Chrome Web Store link
3. Add installation badge to GitHub
4. Promote to TopstepX trading community

---

## 🚀 Next Steps

### IMMEDIATE (Before Submission):

1. **Create Screenshots** ⚠️ REQUIRED
   - Take 2-5 screenshots of extension in action
   - Recommended size: 1280x800px
   - Save to `assets/store-screenshots/`

2. **Create Large Promo Tile** (Recommended)
   - Size: 440x280px
   - Include logo and tagline
   - Save to `assets/store-promo-tile.png`

3. **Test Build Script**
   ```bash
   ./build-store.sh
   ```

4. **Verify ZIP Contents**
   - Unzip and manually check all files are correct
   - Test by loading as unpacked extension
   - Verify no development files included

### SUBMISSION DAY:

1. Register Chrome Web Store developer account ($5 fee)
2. Run build script to create ZIP
3. Upload to Chrome Web Store
4. Fill in all store listing information
5. Upload icons and screenshots
6. Submit for review

### POST-APPROVAL:

1. Update README.md with store link
2. Create GitHub release
3. Share with TopstepX community
4. Monitor user feedback and reviews

---

## 📞 Support During Review

If reviewers have questions:
- Respond promptly (within 24 hours)
- Provide clear explanations
- Offer additional documentation if needed
- Be professional and courteous

**Developer Contact:**
- GitHub: https://github.com/cmacha2
- Issues: https://github.com/cmacha2/topstepx-sl-tp-assistant/issues

---

## 🎉 Success Criteria

Extension is ready to submit when:
- [x] All code is clean and functional
- [x] manifest.json is correct
- [x] Privacy policy is complete
- [x] README is updated
- [x] Build script works
- [ ] Screenshots created (2-5)
- [ ] Large promo tile created (recommended)
- [ ] Developer account registered
- [ ] Store listing text prepared

**Current Status: 85% Complete**

**Remaining: Create screenshots and promo tile, then READY TO SUBMIT!**

---

## 💡 Tips for Success

1. **Be Patient:** Review can take up to 5 business days
2. **Be Thorough:** Complete all optional fields for better ranking
3. **Be Honest:** Clear about what extension does and doesn't do
4. **Be Professional:** Well-written descriptions and quality screenshots
5. **Be Responsive:** Reply quickly to any reviewer questions

---

## 📚 Resources

- Chrome Web Store Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Developer Program Policies: https://developer.chrome.com/docs/webstore/program-policies/
- Best Practices: https://developer.chrome.com/docs/webstore/best-practices/
- Branding Guidelines: https://developer.chrome.com/docs/webstore/branding/

---

**Last Updated:** December 15, 2024
**Version:** 4.5.5
**Status:** Ready for screenshots, then submission

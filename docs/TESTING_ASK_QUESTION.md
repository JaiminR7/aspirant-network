# Testing the Ask Question Feature

## Prerequisites

1. Server is running on http://localhost:5000
2. Client is running on http://localhost:5173
3. Database has been seeded with subjects and topics
4. You have a registered user account

## Steps to Test

### 1. Open the Application

- Navigate to http://localhost:5173
- Log in with your credentials

### 2. Navigate to Ask Question Page

- Click on "Ask Question" button/link in the navigation
- You should see the "Ask a Question" form

### 3. Fill Out the Form

#### Title Field

- Enter a question title (minimum 10 characters)
- Example: "How do I solve quadratic equations quickly?"
- Character counter should show: (X/300)

#### Description Field

- Enter a detailed description (minimum 20 characters)
- Example: "I'm preparing for JEE and struggling with solving quadratic equations under time pressure. What are the best tricks and shortcuts I should know?"
- Character counter should show: (X/5000)

#### Subject Selection

- Click on the "Subject" dropdown
- You should see a list of subjects for your exam (e.g., Mathematics, Physics, Chemistry for JEE)
- Select one subject

#### Topic Selection

- After selecting a subject, the "Topic" dropdown will be enabled
- Click on the "Topic" dropdown
- You should see topics related to the selected subject
- Select one topic

#### System Tags (Optional)

- Click on any of the pre-defined tags like "doubt", "concept-clarity", etc.
- Selected tags will be highlighted

#### User Tags (Optional)

- Type a custom tag and press Enter or click the "+" button
- You can add up to 3 custom tags
- Click the "×" on a tag to remove it

#### Anonymous Option (Optional)

- Check the "Post anonymously" checkbox if you want to post without your name

### 4. Verify Form Validation

The "Post Question" button will be **disabled** (grayed out) if:

- Title is less than 10 characters OR more than 300 characters
- Description is less than 20 characters OR more than 5000 characters
- No subject is selected
- No topic is selected

The button will be **enabled** (blue/clickable) when ALL of these are met:

- ✅ Title between 10-300 characters
- ✅ Description between 20-5000 characters
- ✅ Subject selected
- ✅ Topic selected

### 5. Submit the Question

Once the button is enabled:

1. Click "Post Question"
2. The button text will change to "Posting..."
3. On success, you'll be redirected to the question detail page
4. If there's an error, you'll see a red error message at the top of the form

### 6. Check Browser Console

Open Developer Tools (F12) and check the Console tab for:

- "Fetching subjects..." - When page loads
- "✅ Subjects loaded: X" - Number of subjects loaded
- "Fetching topics for subject: [ID]" - When you select a subject
- "✅ Topics loaded: X" - Number of topics loaded
- "Form validation: {...}" - Shows which fields are valid/invalid
- "Question created successfully: {...}" - When question is posted

## Troubleshooting

### If subjects dropdown is empty:

1. Check server console - should show "✅ Found subjects: X"
2. Check browser console for error messages
3. Verify you're logged in (check localStorage for 'token' and 'user')
4. Verify your user has a `primaryExam` field set

### If topics dropdown is empty after selecting subject:

1. Check browser console for "✅ Topics loaded: X"
2. Check server logs for any errors
3. Verify the subject ID is correct

### If "Post Question" button stays disabled:

1. Open browser console
2. Look for "Form validation: {...}" logs
3. Check which field is marked as invalid
4. Verify all minimum character requirements are met

### If posting fails:

1. Check the error message displayed on the page
2. Check browser console for detailed error
3. Check server console for backend errors
4. Verify authentication token is valid (try logging out and back in)

## Expected Behavior Summary

✅ **On page load**: Subjects dropdown populates automatically
✅ **On subject select**: Topics dropdown populates with relevant topics
✅ **On form fill**: Button enables when all required fields are valid
✅ **On submit**: Question is created and you're redirected to question detail page
✅ **Error handling**: Clear error messages are shown if something fails

## Console Logs to Look For

### Success Path:

```
Fetching subjects...
Subjects response: {success: true, data: Array(3)}
✅ Subjects loaded: 3

[User selects subject]
Fetching topics for subject: 698062987072b235ddf963f1
Topics response: {success: true, data: Array(5)}
✅ Topics loaded: 5

[User fills form]
Form validation: {titleValid: true, descriptionValid: true, subjectValid: true, topicValid: true, isValid: true}

[User clicks Post Question]
Submitting question with data: {...}
Question created successfully: {success: true, data: {...}}
```

## Server-Side Verification

Check server console for:

```
🔍 Getting subjects for exam: JEE
✅ Found subjects: 3
```

And when question is created:

```
[2026-02-02T...] POST /api/questions
```

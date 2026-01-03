# Implementation Guide: All Question Types for QuizScreen

## Current Status
- ✅ MultipleChoice (Type = 1) - Implemented
- ✅ FillBlank (Type = 4) - Implemented
- ⚠️ MultipleAnswers (Type = 2) - Partially implemented (needs checkbox UI)
- ❌ TrueFalse (Type = 3) - Not implemented
- ❌ Matching (Type = 5) - Not implemented
- ❌ Ordering (Type = 6) - Not implemented

## Required Changes

### 1. Update `handleSelectAnswer` to support MultipleAnswers
```javascript
const handleSelectAnswer = async (questionId, answerId, questionType = 1) => {
  // MultipleAnswers (Type = 2): toggle option in array
  if (questionType === 2) {
    const currentAnswers = Array.isArray(selectedAnswers[questionId]) 
      ? selectedAnswers[questionId] 
      : (selectedAnswers[questionId] ? [selectedAnswers[questionId]] : []);
    const newAnswers = currentAnswers.includes(answerId)
      ? currentAnswers.filter(id => id !== answerId)
      : [...currentAnswers, answerId];
    
    setSelectedAnswers({ ...selectedAnswers, [questionId]: newAnswers });
    await quizService.saveAnswer(attemptId, questionId, newAnswers);
    return;
  }
  // ... rest of single choice logic
};
```

### 2. Add handlers for Matching and Ordering
```javascript
const handleMatchingAnswer = async (questionId, matches) => {
  setSelectedAnswers({ ...selectedAnswers, [questionId]: matches });
  await quizService.saveAnswer(attemptId, questionId, matches);
};

const handleOrderingAnswer = async (questionId, orderedIds) => {
  setSelectedAnswers({ ...selectedAnswers, [questionId]: orderedIds });
  await quizService.saveAnswer(attemptId, questionId, orderedIds);
};
```

### 3. Update `renderQuestion` to handle all types
- Type 1 (MultipleChoice): Current implementation OK
- Type 2 (MultipleAnswers): Use checkbox instead of radio, show hint
- Type 3 (TrueFalse): Two large buttons (Đúng/Sai)
- Type 4 (FillBlank): Current implementation OK
- Type 5 (Matching): Two columns, click to match
- Type 6 (Ordering): Drag/drop or up/down arrows

### 4. Add styles for new question types
- `trueFalseContainer`, `trueFalseOption`, `trueFalseOptionSelected`
- `matchingContainer`, `matchingColumn`, `matchingItem`, `matchingItemSelected`
- `orderingList`, `orderingItem`, `orderingItemActions`, `orderingActionButton`
- `multipleAnswersHint`, `answerCheckbox`, `answerCheckboxSelected`

## Implementation Priority
1. MultipleAnswers (Type = 2) - Easy, just change radio to checkbox
2. TrueFalse (Type = 3) - Simple two-button UI
3. Matching (Type = 5) - More complex, needs two-column layout
4. Ordering (Type = 6) - Most complex, needs drag/drop or arrow buttons


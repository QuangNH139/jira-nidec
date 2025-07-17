#!/bin/bash

# Migration helper script to identify files that could benefit from shared utilities

echo "=== Jira Project - Refactoring Analysis ==="
echo ""

# Function to count occurrences of patterns
count_pattern() {
    pattern="$1"
    description="$2"
    echo "🔍 Searching for: $description"
    echo "Pattern: $pattern"
    grep -r "$pattern" frontend/src --include="*.tsx" --include="*.ts" | grep -v node_modules | wc -l
    echo ""
}

# Check for hardcoded validation rules
echo "📋 VALIDATION RULES ANALYSIS"
echo "================================"
count_pattern "required: true, message:" "Hardcoded required validation"
count_pattern "min: [0-9], message:" "Hardcoded min length validation"
count_pattern "max: [0-9], message:" "Hardcoded max length validation"

# Check for hardcoded select options
echo "🎯 SELECT OPTIONS ANALYSIS"
echo "================================"
count_pattern 'value="task".*Task' "Hardcoded task options"
count_pattern 'value="low".*Low' "Hardcoded priority options"
count_pattern '\[0.*1.*2.*3.*4.*5.*6.*7.*8.*9.*10\]' "Hardcoded story points array"

# Check for query invalidation patterns
echo "🔄 QUERY INVALIDATION ANALYSIS"
echo "================================"
count_pattern "invalidateQueries.*queryKey.*issues" "Issues query invalidation"
count_pattern "invalidateQueries.*queryKey.*backlog" "Backlog query invalidation"
count_pattern "invalidateQueries.*queryKey.*kanban" "Kanban query invalidation"

# Check for image upload patterns
echo "📷 IMAGE UPLOAD ANALYSIS"
echo "================================"
count_pattern "beforeUpload.*uploadAPI" "Custom image upload logic"
count_pattern "accept=\"image/\*\"" "Image upload components"

# Check for modal footer patterns
echo "🎭 MODAL FOOTER ANALYSIS"
echo "================================"
count_pattern "justifyContent.*flex-end.*gap.*8px" "Custom modal footers"
count_pattern "Button.*Cancel.*Button.*primary" "Standard cancel/submit pattern"

echo "💡 RECOMMENDATIONS"
echo "================================"
echo "Files that would benefit most from refactoring:"
echo ""

# Find files with multiple patterns (highest priority for refactoring)
echo "High Priority (Multiple patterns):"
grep -l "required: true, message:" frontend/src/**/*.tsx 2>/dev/null | \
    xargs grep -l "value=\"task\"" 2>/dev/null | \
    xargs grep -l "invalidateQueries" 2>/dev/null | \
    head -5

echo ""
echo "Medium Priority (Query invalidation):"
grep -l "invalidateQueries.*queryKey" frontend/src/**/*.tsx 2>/dev/null | head -5

echo ""
echo "Low Priority (Individual patterns):"
grep -l "accept=\"image/\*\"" frontend/src/**/*.tsx 2>/dev/null | head -3

echo ""
echo "✅ Already Refactored:"
echo "- EditIssueModal.tsx (Updated to use shared utilities)"
echo "- CreateIssueModal.tsx (Updated to use shared utilities)"

echo ""
echo "🚀 To continue refactoring:"
echo "1. Update remaining modals to use shared FormSelects"
echo "2. Replace hardcoded validation with shared rules"
echo "3. Use useQueryInvalidation hook for query management"
echo "4. Replace custom image upload with ImageUpload component"

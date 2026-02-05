import re

# Read the storeMapping.ts file
with open('data/storeMapping.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all South and Rest Of South region entries and replace Trainer with H3365
# Pattern to match store records with South or Rest Of South region
pattern = r'(\{ "Store ID": "[^"]+", "location": "[^"]+", "Region": "(?:South|Rest Of South)", "AM": "[^"]+", "Trainer": )"[^"]*"'
replacement = r'\1"H3365"'

updated_content = re.sub(pattern, replacement, content)

# Count how many replacements were made
matches = re.findall(pattern, content)
print(f"Updated {len(matches)} stores to have H3365 as trainer")

# Write back to file
with open('data/storeMapping.ts', 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("Successfully updated storeMapping.ts")

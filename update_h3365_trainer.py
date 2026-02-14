import json

# Read the master store mapping file
with open('data/master-store-mapping.json', 'r', encoding='utf-8') as f:
    stores = json.load(f)

# Update stores in South and Rest Of South regions
updated_count = 0
for store in stores:
    if store.get('Region') in ['South', 'Rest Of South']:
        # Shift existing trainers down
        if 'Trainer 2' in store and store['Trainer 2']:
            store['Trainer 3'] = store['Trainer 2']
            store['Trainer 3 Name'] = store.get('Trainer 2 Name', '')
        
        if 'Trainer 1' in store and store['Trainer 1']:
            store['Trainer 2'] = store['Trainer 1']
            store['Trainer 2 Name'] = store.get('Trainer 1 Name', '')
        
        # Add H3365 as Trainer 1
        store['Trainer 1'] = 'H3365'
        store['Trainer 1 Name'] = 'Muthu K'
        
        updated_count += 1
        print(f"Updated {store['Store ID']} - {store['location']}")

# Write back to file
with open('data/master-store-mapping.json', 'w', encoding='utf-8') as f:
    json.dump(stores, f, indent=2, ensure_ascii=False)

print(f"\nTotal stores updated: {updated_count}")

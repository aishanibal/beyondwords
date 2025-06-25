csv_path = "opensmile_features/chunk_0_word_4.csv"
with open(csv_path, 'r') as f:
    lines = f.readlines()

data_idx = next((i for i, line in enumerate(lines) if line.strip() == '@data'), None)
print("Lines after @data:")
for i in range(data_idx, min(data_idx+6, len(lines))):
    print(f"{i}: {lines[i].strip()}")
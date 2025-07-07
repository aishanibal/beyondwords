def parse_opensmile_arff_csv(csv_path):
    with open(csv_path, 'r') as f:
        lines = f.readlines()
    attributes = [line.split()[1] for line in lines if line.startswith('@attribute')]
    data_idx = next((i for i, line in enumerate(lines) if line.strip() == '@data'), None)
    value_line = None
    if data_idx is not None:
        for i in range(data_idx + 1, len(lines)):
            if lines[i].strip() and not lines[i].startswith('%'):
                value_line = lines[i].strip()
                break
    if value_line:
        values = value_line.split(',')
        attributes = [a.strip() for a in attributes]
        values = [v.strip() for v in values]
        features = dict(zip(attributes, values))
        return features
    else:
        print("No data found after @data line.")
        return {}

if __name__ == "__main__":
    csv_path = "opensmile_features/chunk_0_word_4.csv"
    features = parse_opensmile_arff_csv(csv_path)
    # Remove non-numeric fields
    core_features = {k: v for k, v in features.items() if k not in ['name', 'class']}
    # Convert to float where possible
    for k in core_features:
        try:
            core_features[k] = float(core_features[k])
        except ValueError:
            core_features[k] = None

    # Example analysis
    print("--- Feature Analysis for", csv_path, "---")
    # Pitch
    print("Pitch (F0semitoneFrom27.5Hz_sma3nz_amean):", core_features.get('F0semitoneFrom27.5Hz_sma3nz_amean'))
    # Loudness
    print("Loudness (loudness_sma3_amean):", core_features.get('loudness_sma3_amean'))
    # MFCCs
    mfccs = [core_features.get(f'mfcc{i}_sma3_amean') for i in range(1, 5)]
    print("MFCC means:", mfccs)
    # Voicing
    print("Jitter (jitterLocal_sma3nz_amean):", core_features.get('jitterLocal_sma3nz_amean'))
    print("Shimmer (shimmerLocaldB_sma3nz_amean):", core_features.get('shimmerLocaldB_sma3nz_amean'))
    print("HNR (HNRdBACF_sma3nz_amean):", core_features.get('HNRdBACF_sma3nz_amean'))
    # Voiced segments
    print("Voiced segments per second:", core_features.get('VoicedSegmentsPerSec'))
    print("Mean voiced segment length (sec):", core_features.get('MeanVoicedSegmentLengthSec'))
    print("Equivalent sound level (dBp):", core_features.get('equivalentSoundLevel_dBp'))
    # Summary statistics
    numeric_values = [v for v in core_features.values() if isinstance(v, float)]
    if numeric_values:
        print("\nSummary statistics:")
        print("Mean:", sum(numeric_values)/len(numeric_values))
        print("Min:", min(numeric_values))
        print("Max:", max(numeric_values))
    else:
        print("No numeric features found.") 
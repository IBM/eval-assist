import pandas as pd

def create_sample_data(context_groups=1, context_groups_len=1, context_group_cols=2, file_name='example', string_len = 500):
    print('Creating csv')
    print(f'The csv file will have {context_groups * context_groups_len} rows and {context_group_cols + 2} columns')
    context_c_text = "a" * string_len
    rows = []
    for i in range(context_groups):
        for j in range(context_groups_len):
            row = {
                'config': "generic_config", 
                'model_output': "o" * string_len, 
            }
            for k in range(context_group_cols):
                row[f'context_c{k}'] = context_c_text + '_' + str(k) + '_' + str(i)
            rows.append(row)
    
    df = pd.DataFrame(data=rows)
    df.to_csv(f'./file_examples/{file_name}.csv', index=False)

if __name__ == "__main__":
    create_sample_data(1, 1, 1, "sample_100examples_4exps_4contextcol", 100)
    create_sample_data(2, 2, 2, "sample_2examples_2exps_2contextcol", 100)
    create_sample_data(10, 2, 2, "sample_10examples_2exps_2contextcol", 100)
    create_sample_data(100, 4, 2, "sample_100examples_4exps_4contextcol", 100)
    create_sample_data(1000, 50, 2, "sample_1000examples_50exps_10contextcol", 100)
    create_sample_data(10000, 50, 2, "sample_10000examples_50exps_10contextcol", 100)





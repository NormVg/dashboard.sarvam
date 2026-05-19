

const A = `

Hey! I'm doing great, thanks for asking! 😊

Here's a simple Python code to list directory contents:

\`\`\`python
import os

# List files and directories in the current directory
print("Files and directories in current location:")
for item in os.listdir('.'):
    print(item)
\`\`\`

Or if you want to list contents of a specific directory:

\`\`\`python
import os

# List contents of a specific directory
directory = '/path/to/your/directory'  # Replace with your directory path
print(f"Contents of {directory}:")
for item in os.listdir(directory):
    print(item)
\`\`\`

Here's another modern approach using \`pathlib\`:

\`\`\`python
from pathlib import Path

# List current directory contents
print("Current directory contents:")
for item in Path('.').iterdir():
    print(item)
\`\`\`

These will show you the files and folders in the specified location. Let me know if you need any modifications!
`

const B = `

Hey! I'm doing great, thanks for asking!

Here's a simple Python code to list the contents of a directory:

\`\`\`python
import os

# List files and directories in current location
print("Contents of current directory:")
for item in os.listdir('.'):
    print(f"  {item}")
\`\`\`

Or if you want to list just files (not directories):

\`\`\`python
import os

# List only files in current directory
print("Files in current directory:")
files = [f for f in os.listdir('.') if os.path.isfile(f)]
for file in files:
    print(f"  {file}")
\`\`\`

Or list files in a specific directory:

\`\`\`python
import os

# List contents of specific directory
directory = './'  # or any path like '/path/to/directory'
print(f"Contents of {directory}:")
for item in os.listdir(directory):
    print(f"  {item}")
\`\`\`

The \`os.listdir()\` function returns a list of all files and directories in the specified path. Let me know if you'd like to see how to use any of these! 🚀
`


const d1 = `Hey, How are you brother ?`

const d2 = `Hii, how you been Brother !`

import { markdownToTxt } from "markdown-to-txt";

const tokeniser = async (string) => {
  let tokens = [];

  string.split(' ').forEach(token => {
    tokens.push(token);
  })

  return tokens;
}

const markdown2Text = async (markdown) => {
  let text = markdownToTxt(markdown);


  return text;
}


const buildTable = async (doc1, doc2) => {

  let table = [];




  for (let i = 0; i < doc1.length + 1; i++) {
    table.push([]);
    for (let j = 0; j < doc2.length + 1; j++) {
      table[i].push(0);
    }
  }





  return table;
}

const printTable = async (table, rowNames, collomNames) => {
  let tableData = {};

  let rowN = ["x", ...rowNames];
  let colN = ["y", ...collomNames];

  for (let i = 0; i < table.length; i++) {

    const rowKey = `${i}_${rowN[i]}`;
    let rowObject = {};

    for (let j = 0; j < table[i].length; j++) {
      const colKey = `${j}_${colN[j]}`;
      rowObject[colKey] = table[i][j];
    }

    tableData[rowKey] = rowObject;
  }


  console.table(tableData);
}



const lcs = async (doc1, doc2, table) => {
  console.log(doc1)
  console.log(doc2)



  for (let i = 1; i <= doc1.length; i++) {



    for (let j = 1; j <= doc2.length; j++) {



      if (doc1[i - 1].toLowerCase() === doc2[j - 1].toLowerCase()) {


        table[i][j] = table[i - 1][j - 1] + 1;


      } else {


        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);


      }


    }
  }


  return table;
}


const commonSeq = async (table, doc1, doc2) => {

  let i = table.length - 1;
  let j = table[0].length - 1;


  let common_details = [];

  while (i > 0 && j > 0) {

    if (doc1[i - 1].toLowerCase() === doc2[j - 1].toLowerCase()) {

      common_details.push({
        token: doc1[i - 1].toLowerCase(),
        index_doc1: i - 1,
        index_doc2: j - 1
      });


      i--;
      j--;
    }

    else {

      if (table[i - 1][j] > table[i][j - 1]) {

        i--;

      }
      else {

        j--;

      }
    }
  }


  return common_details.reverse();
}

const getFormatedOutput = async (tokens1, tokens2, common_details) => {
  let output = {
    tokens1: [],
    tokens2: []
  };


  const commonDoc1Set = common_details.map(item => item.index_doc1)
  const commonDoc2Set = common_details.map(item => item.index_doc2);



  tokens1.forEach((token, index) => {
    output.tokens1.push({
      token: token,
      isCommon: commonDoc1Set.includes(index)
    });
  });

  tokens2.forEach((token, index) => {
    output.tokens2.push({
      token: token,
      isCommon: commonDoc2Set.includes(index)
    });
  });


  // simple continues grouping of false and true together blocks of tokens
  const group = (list) => {

    if (list.length === 0) return [];



    let grouped = [];

    let current = {
      token: list[0].token,
      isCommon: list[0].isCommon
    };


    for (let i = 1; i < list.length; i++) {


      if (list[i].isCommon === current.isCommon) {

        current.token += " " + list[i].token;

      } else {

        grouped.push(current);
        current = {
          token: list[i].token,
          isCommon: list[i].isCommon
        };
      }
    }
    grouped.push(current);
    return grouped;
  };

  output.tokens1 = group(output.tokens1);
  output.tokens2 = group(output.tokens2);

  return output;
}


const printFormattedOutput = async (output) => {


  let tokens1 = "";
  let tokens2 = "";



  output.tokens1.forEach(token => {
    if (token.isCommon) {
      tokens1 += "\u001b[4m" + token.token + "\u001b[24m "
    } else {
      tokens1 += token.token + " "
    }
  })

  output.tokens2.forEach(token => {
    if (token.isCommon) {
      tokens2 += "\u001b[4m" + token.token + "\u001b[24m "
    } else {
      tokens2 += token.token + " "
    }
  })


  console.log(tokens1)
  console.log(tokens2)




}


const algoLCS = async (doc1, doc2) => {

  doc1 = await markdown2Text(doc1);
  doc2 = await markdown2Text(doc2);

  let tokens1 = await tokeniser(doc1);
  let tokens2 = await tokeniser(doc2);



  let table = await buildTable(tokens1, tokens2);
  printTable(table, tokens1, tokens2)

  table = await lcs(tokens1, tokens2, table);

  printTable(table, tokens1, tokens2)

  let common = await commonSeq(table, tokens1, tokens2)
  console.log(common)

  let formatedOutput = await getFormatedOutput(tokens1, tokens2, common);
  console.log(formatedOutput)

  await printFormattedOutput(formatedOutput)
}


//algoLCS(d1, d2);
algoLCS(A, B);

import { markdownToTxt } from "markdown-to-txt";

export type DiffOp = {
  type: 'equal' | 'insert' | 'delete';
  text: string;
};

export type DiffAlgorithm = 'none' | 'diff';

const tokeniser = async (string: string) => {
  let tokens: string[] = [];

  string.split(' ').forEach(token => {
    tokens.push(token);
  })

  return tokens;
}

const markdown2Text = async (markdown: string) => {
  let text = markdownToTxt(markdown);


  return text;
}


const buildTable = async (doc1: string[], doc2: string[]) => {

  let table: number[][] = [];


  // A table of length (doc1.length + 1) * (doc2.length + 1) also add row and collom names

  for (let i = 0; i < doc1.length + 1; i++) {
    table.push([]);
    for (let j = 0; j < doc2.length + 1; j++) {
      table[i].push(0);
    }
  }





  return table;
}

const printTable = async (table: number[][], rowNames: string[], collomNames: string[]) => {
  let tableData: any = {};

  let rowN = ["x", ...rowNames];
  let colN = ["y", ...collomNames];

  for (let i = 0; i < table.length; i++) {

    const rowKey = `${i}_${rowN[i]}`;
    let rowObject: any = {};

    for (let j = 0; j < table[i].length; j++) {
      const colKey = `${j}_${colN[j]}`;
      rowObject[colKey] = table[i][j];
    }

    tableData[rowKey] = rowObject;
  }


  console.table(tableData);
}



const lcs = async (doc1: string[], doc2: string[], table: number[][]) => {
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


const commonSeq = async (table: number[][], doc1: string[], doc2: string[]) => {

  let i = table.length - 1;
  let j = table[0].length - 1;


  let common_details: any[] = [];

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

const getFormatedOutput = async (tokens1: string[], tokens2: string[], common_details: any[]) => {
  let output: { tokens1: any[], tokens2: any[] } = {
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



  const group = (list: any[]) => {

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

export async function computeCustomDiff(textA: string, textB: string): Promise<{ diffA: DiffOp[], diffB: DiffOp[] }> {
  if (!textA && !textB) return { diffA: [], diffB: [] };

  const doc1 = await markdown2Text(textA);
  const doc2 = await markdown2Text(textB);

  const tokens1 = await tokeniser(doc1);
  const tokens2 = await tokeniser(doc2);

  let table = await buildTable(tokens1, tokens2);

  table = await lcs(tokens1, tokens2, table);

  const common = await commonSeq(table, tokens1, tokens2);
  const formatted = await getFormatedOutput(tokens1, tokens2, common);

  const diffA: DiffOp[] = formatted.tokens1.map(t => ({
    type: t.isCommon ? 'equal' : 'delete',
    text: t.token + " "
  }));

  const diffB: DiffOp[] = formatted.tokens2.map(t => ({
    type: t.isCommon ? 'equal' : 'insert',
    text: t.token + " "
  }));

  return { diffA, diffB };
}

const diffCache = new Map<string, { diffA: DiffOp[], diffB: DiffOp[] }>();

export async function computeDiff(algo: DiffAlgorithm, textA: string, textB: string): Promise<{ diffA: DiffOp[], diffB: DiffOp[] }> {
  if (!textA && !textB) return { diffA: [], diffB: [] };

  const cacheKey = `${algo}:${textA}|||${textB}`;
  if (diffCache.has(cacheKey)) {
    return diffCache.get(cacheKey)!;
  }

  let result: { diffA: DiffOp[], diffB: DiffOp[] };
  switch (algo) {
    case 'diff':
      result = await computeCustomDiff(textA, textB);
      break;
    case 'none':
    default:
      result = {
        diffA: [{ type: 'equal' as const, text: textA }],
        diffB: [{ type: 'equal' as const, text: textB }]
      };
      break;
  }

  diffCache.set(cacheKey, result);
  return result;
}

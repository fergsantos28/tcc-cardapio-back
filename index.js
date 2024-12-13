const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const port = 3000;
const JWT_SECRET = "secret";
const folderStorage = "./uploads";

app.use(express.json());


const uploadPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}


app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "cardapio",
});

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
  } else {
    console.log("Conectado ao banco de dados MySQL!");
  }
});

app.post("/login", (req, res) => {
  const { nome_usuario, senha } = req.body;

  if (!nome_usuario || !senha) {
    return res
      .status(400)
      .json({ erro: "Nome de usuário e senha são obrigatórios" });
  }

  const sql = "SELECT * FROM usuarios WHERE nome_usuario = ? AND senha = ?";
  db.query(sql, [nome_usuario, senha], (err, results) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ erro: "Erro ao verificar as credenciais" });
    }

    if (results.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const usuario = { nome_usuario };
    const token = jwt.sign(usuario, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      mensagem: "Login bem-sucedido",
      usuario: nome_usuario,
      token: token,
    });
  });
});

app.post("/pedido", (req, res) => {
  const { nome_cliente, mesa_id, produtos, telefone } = req.body;

  
  if (
    !nome_cliente ||
    !mesa_id ||
    !produtos ||
    !Array.isArray(produtos) ||
    !produtos.length
  ) {
    return res.status(400).json({
      erro: "Nome do cliente, mesa e produtos são obrigatórios! Certifique-se de enviar os produtos como uma lista válida.",
    });
  }

  
  const valorTotal = produtos.reduce((total, produto) => {
    if (!produto.quantidade || !produto.valor || !produto.nome_produto) {
      throw new Error(
        "Produto inválido. Certifique-se de incluir nome_produto, quantidade e valor para cada item."
      );
    }
    return total + produto.quantidade * produto.valor;
  }, 0);

  // Inserindo o pedido na tabela 'pedidos'
  const sqlPedido =
    "INSERT INTO pedidos (nome_cliente, mesa_id, valor_total, telefone) VALUES (?, ?, ?, ?)";
  db.query(
    sqlPedido,
    [nome_cliente, mesa_id, valorTotal, telefone],
    (err, result) => {
      if (err) {
        console.error("Erro ao inserir pedido:", err);
        return res
          .status(500)
          .json({ erro: "Erro ao salvar o pedido no banco de dados." });
      }

      const pedidoId = result.insertId;

      // Preparando os valores para inserção na tabela 'produtos_pedido'
      const sqlProduto =
        "INSERT INTO produtos_pedido (pedido_id, nome_produto, quantidade, valor) VALUES ?";
      const values = produtos.map((produto) => [
        pedidoId,
        produto.nome_produto,
        produto.quantidade,
        produto.valor,
      ]);

      // Inserindo os produtos associados ao pedido
      db.query(sqlProduto, [values], (err) => {
        if (err) {
          console.error("Erro ao inserir produtos:", err);
          return res
            .status(500)
            .json({ erro: "Erro ao salvar os produtos no banco de dados." });
        }

        res.status(201).json({
          mensagem: "Pedido e produtos salvos com sucesso!",
          pedidoId,
          mesaId: mesa_id,
          valorTotal,
          produtos,
        });
      });
    }
  );
});

app.put("/statuspedido/:pedido_id", (req, res) => {
  const pedidoId = req.params.pedido_id;
  const { status } = req.body; // O status é enviado no corpo da requisição

  const sql = `
        UPDATE pedidos
        SET statusPedido = ?, data_alteracao_status_pedido = CURRENT_TIMESTAMP()
        WHERE id = ?
    `;

  db.query(sql, [status, pedidoId], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar o status do pedido:", err);
      return res
        .status(500)
        .json({ erro: "Erro ao atualizar o status do pedido" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Pedido não encontrado." });
    }

    res.json({ mensagem: "Status do pedido atualizado com sucesso." });
  });
});

app.get("/historico/:mesa_id", (req, res) => {
  const mesaId = req.params.mesa_id;
  const sql = `
    SELECT p.id AS pedidoId, p.nome_cliente, p.statusPedido, p.valor_total, p.data_pedido, p.telefone, pr.nome_produto, pr.quantidade, pr.valor
    FROM pedidos p
    JOIN produtos_pedido pr ON p.id = pr.pedido_id
    WHERE p.mesa_id = ?
    ORDER BY p.data_pedido DESC
  `;

  db.query(sql, [mesaId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar pedidos:", err);
      return res
        .status(500)
        .json({ erro: "Erro ao buscar o histórico de pedidos" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ mensagem: "Nenhum pedido encontrado para esta mesa." });
    }

    const historico = results.reduce((acc, row) => {
      const {
        pedidoId,
        nome_cliente,
        valor_total,
        data_pedido,
        nome_produto,
        quantidade,
        valor,
        telefone,
        statusPedido,
      } = row;

      if (!acc[pedidoId]) {
        acc[pedidoId] = {
          pedidoId,
          nome_cliente,
          statusPedido,
          telefone,
          valor_total,
          data_pedido,
          produtos: [],
        };
      }

      acc[pedidoId].produtos.push({
        nome_produto,
        quantidade,
        valor,
      });
      return acc;
    }, {});

    res.json({
      historico: Object.values(historico),
    });
  });
});

app.get("/storage/:filename", (req, res) => {
  try {
    const filePath = path.resolve(folderStorage, req.params.filename); corretamente
    // Envia o arquivo solicitado ao cliente
    return res.sendFile(filePath);
  } catch (error) {
    console.error("Erro ao buscar o arquivo:", error); // Log de erro para depuração
    return res.status(404).json({ mensagem: "Arquivo não encontrado." });
  }
});
app.delete("/historico/:mesa_id", (req, res) => {
  const mesaId = req.params.mesa_id;

  const sqlVerify = "SELECT id FROM pedidos WHERE mesa_id = ?";
  db.query(sqlVerify, [mesaId], (err, results) => {
    if (err) {
      console.error("Erro ao verificar pedidos:", err);
      return res
        .status(500)
        .json({ erro: "Erro ao verificar pedidos da mesa" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ mensagem: "Nenhum pedido encontrado para esta mesa." });
    }

    const sqlDeleteProdutos =
      "DELETE FROM produtos_pedido WHERE pedido_id IN (SELECT id FROM pedidos WHERE mesa_id = ?)";
    db.query(sqlDeleteProdutos, [mesaId], (err, result) => {
      if (err) {
        console.error("Erro ao deletar produtos dos pedidos:", err);
        return res
          .status(500)
          .json({ erro: "Erro ao deletar produtos dos pedidos" });
      }

      const sqlDeletePedidos = "DELETE FROM pedidos WHERE mesa_id = ?";
      db.query(sqlDeletePedidos, [mesaId], (err, result) => {
        if (err) {
          console.error("Erro ao deletar pedidos:", err);
          return res.status(500).json({ erro: "Erro ao deletar pedidos" });
        }

        res.json({
          mensagem: "Histórico de pedidos da mesa excluído com sucesso!",
        });
      });
    });
  });
});

app.get("/mesas_ativas", (req, res) => {
  const sql = `
    SELECT DISTINCT p.mesa_id
    FROM pedidos p
    WHERE p.statusPedido != 'pago'
      OR p.data_alteracao_status_pedido >= NOW() - INTERVAL 30 MINUTE
    ORDER BY p.mesa_id
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar mesas:", err);
      return res
        .status(500)
        .json({ erro: "Erro ao buscar as mesas com pedidos ativos" });
    }
    if (results.length === 0) {
      return res
        .status(404)
        .json({ mensagem: "Nenhuma mesa com pedidos ativos encontrada." });
    }
    const mesasAtivas = results.map((row) => row.mesa_id);

    res.json({
      mesas: mesasAtivas,
    });
  });
});

// CRUD de Produto


app.delete("/produto/:id", (req, res) => {
  const produtoId = req.params.id;

  const sql = "DELETE FROM produto WHERE id = ?";
  db.query(sql, [produtoId], (err, result) => {
    if (err) {
      console.error("Erro ao deletar produto:", err);
      return res
        .status(500)
        .json({ erro: "Erro ao deletar o produto no banco de dados" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    }

    res.json({ mensagem: "Produto deletado com sucesso!" });
  });
});


app.get("/produto/:id", (req, res) => {
  const produtoId = req.params.id;

  const sql = "SELECT * FROM produto WHERE id = ?"; // Tabela correta
  db.query(sql, [produtoId], (err, results) => {
    if (err) {
      console.error("Erro ao buscar produto:", err);
      return res.status(500).json({ erro: "Erro ao buscar o produto" });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensagem: "Produto não encontrado." });
    }

    res.json({
      produto: results[0],
    });
  });
});

// Listar Produtos
app.get("/produto", (req, res) => {
  const sql = "SELECT * FROM produto";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar produtos:", err);
      return res.status(500).json({ erro: "Erro ao buscar os produtos" });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensagem: "Nenhum produto encontrado." });
    }

    res.json(results || []);
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});


app.post("/produto", (req, res) => {
  try {
    const form = new formidable.IncomingForm();

    
    form.uploadDir = uploadPath; 
    form.keepExtensions = true; 
    form.parse(req, (err, fields, files) => {
      console.log("📢[index.js:396]: files: ", files);
      console.log("📢[index.js:400]: err: ", err);
      if (err) {
        console.error("Erro ao processar o arquivo:", err);
        return res.status(500).json({ erro: "Erro ao processar o arquivo" });
      }

      const { titulo_produto, descricao, valor } = fields;
      console.log("📢[index.js:403]: fields: ", fields);
      if (!files || files.imagem.length === 0 || !Array.isArray(files.imagem)) {
        return res
          .status(400)
          .json({ erro: "Título, descrição, valor e imagem são obrigatórios!1" });
      }
      

      console.log("📢[index.js:406]: ", titulo_produto, descricao, valor);
      const imagem = files?.imagem[0]; 
  
      
      if (!titulo_produto || !descricao || !valor || !imagem) {
        return res
          .status(400)
          .json({ erro: "Título, descrição, valor e imagem são obrigatórios!2" });
      }
  
      
      const valorProduto = parseFloat(valor);
      if (isNaN(valorProduto)) {
        return res
          .status(400)
          .json({ erro: "Valor do produto deve ser um número válido" });
      }
  
      
      const extensao = imagem.originalFilename.split(".").pop(); 
      const imagemPath = `${imagem.newFilename}.${extensao}`; 
  
      
      const imagemFinalPath = `${uploadPath}/${imagemPath}`;
      fs.renameSync(imagem.filepath, imagemFinalPath); 
  
      
      const sql =
        "INSERT INTO produto (titulo_produto, descricao, valor, imagem) VALUES (?, ?, ?, ?)";
      db.query(
        sql,
        [titulo_produto, descricao, valorProduto, imagemPath],
        (err, result) => {
          if (err) {
            console.error("Erro ao inserir produto:", err);
            return res
              .status(500)
              .json({ erro: "Erro ao salvar o produto no banco de dados" });
          }
  
          res.json({
            mensagem: "Produto criado com sucesso!",
            produto: {
              id: result.insertId,
              titulo_produto,
              descricao,
              valor: valorProduto,
              imagemPath,
            },
          });
        }
      );
    }); 
  } catch (error) {
    console.log("📢[index.js:392]: error: ", error);
    
  }

});

// Atualizar Produto
app.put("/produto/:id", (req, res) => {
  try {
    const produtoId = req.params.id;

    const form = new formidable.IncomingForm();
    form.uploadDir = uploadPath; 
    form.keepExtensions = true; 

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Erro ao processar o arquivo:", err);
        return res.status(500).json({ erro: "Erro ao processar o arquivo" });
      }

      const { titulo_produto, descricao, valor } = fields;
      const imagem = files.imagem ? files.imagem[0] : null;

      // Validação dos dados obrigatórios
      if (!titulo_produto || !descricao || !valor) {
        return res.status(400).json({
          erro: "Título, descrição e valor são obrigatórios!",
        });
      }

      // Convertendo o valor para número
      const valorProduto = parseFloat(valor);
      if (isNaN(valorProduto)) {
        return res
          .status(400)
          .json({ erro: "Valor do produto deve ser um número válido" });
      }

      let imagemNome = null;      
     

      
      let sql = "UPDATE produto SET titulo_produto = ?, descricao = ?, valor = ?";
      const params = [titulo_produto, descricao, valorProduto];

      if (imagemNome) {
        sql += ", imagem = ?";
        params.push(imagemNome);
      }

      sql += " WHERE id = ?";
      params.push(produtoId);

      // Atualizar o produto no banco de dados
      db.query(sql, params, (err, result) => {
        if (err) {
          console.error("Erro ao atualizar produto:", err);
          return res
            .status(500)
            .json({ erro: "Erro ao atualizar o produto no banco de dados" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ mensagem: "Produto não encontrado." });
        }

        res.json({ mensagem: "Produto atualizado com sucesso!" });
      });
    });
  } catch (error) {
    console.error("Erro inesperado:", error);
    res.status(500).json({ erro: "Erro inesperado ao atualizar o produto" });
  }
});




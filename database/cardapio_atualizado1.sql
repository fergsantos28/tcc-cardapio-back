-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 08/12/2024 às 05:37
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Banco de dados: `cardapio`
CREATE DATABASE IF NOT EXISTS `cardapio` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `cardapio`;

-- --------------------------------------------------------

-- Estrutura para tabela `pedidos`
DROP TABLE IF EXISTS `pedidos`;
CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome_cliente` varchar(255) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `data_pedido` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_alteracao_status_pedido` timestamp NULL DEFAULT current_timestamp(),
  `mesa_id` int(11) NOT NULL,
  `statusPedido` varchar(50) NOT NULL DEFAULT 'ativo',
  `telefone` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Despejando dados para a tabela `pedidos`
INSERT INTO `pedidos` (`nome_cliente`, `valor_total`, `data_pedido`, `data_alteracao_status_pedido`, `mesa_id`, `statusPedido`, `telefone`) VALUES
('siltec', 94.00, '2024-12-08 01:49:14', '2024-12-08 04:17:49', 3, 'Pronto', '18988117352'),
('admin', 34.00, '2024-12-08 04:18:14', '2024-12-08 04:36:31', 0, 'Pronto', '18988117352'),
('fabiocruz', 45.00, '2024-12-08 04:36:20', '2024-12-08 04:36:20', 2, 'ativo', '18988117352');

-- --------------------------------------------------------

-- Estrutura para tabela `produto`
DROP TABLE IF EXISTS `produto`;
CREATE TABLE `produto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo_produto` varchar(255) DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `valor` float DEFAULT NULL,
  `imagem` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Despejando dados para a tabela `produto`
INSERT INTO `produto` (`titulo_produto`, `descricao`, `valor`, `imagem`) VALUES
('Produto X', 'Descrição do Produto X', 100, 0),
('Produto A', 'Descrição do Produto A', 100, 0);

-- --------------------------------------------------------

-- Estrutura para tabela `produtos_pedido`
DROP TABLE IF EXISTS `produtos_pedido`;
CREATE TABLE `produtos_pedido` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pedido_id` int(11) NOT NULL,
  `nome_produto` varchar(255) NOT NULL,
  `quantidade` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Despejando dados para a tabela `produtos_pedido`
INSERT INTO `produtos_pedido` (`pedido_id`, `nome_produto`, `quantidade`, `valor`) VALUES
(1, 'Classic Burger', 5, 15.00),
(1, 'Spicy Pepper Jack', 1, 15.00),
(1, 'Coca-Cola', 1, 4.00),
(2, 'Chicken Crunch', 1, 15.00),
(2, 'Double Trouble', 1, 15.00),
(2, 'Coca-Cola', 1, 4.00),
(3, 'Spicy Pepper Jack', 1, 15.00),
(3, 'Bacon Lovers', 1, 15.00),
(3, 'Cheese Bomb', 1, 15.00);

-- --------------------------------------------------------

-- Estrutura para tabela `usuarios`
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome_usuario` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Despejando dados para a tabela `usuarios`
INSERT INTO `usuarios` (`nome_usuario`, `senha`) VALUES
('admin', '123456');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
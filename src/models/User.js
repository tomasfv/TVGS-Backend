const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('user', {
    id: {
        type: DataTypes.UUID,             //UUID genera un codigo random único con letras y numeros. DataType de Sequelize(Universal Unique Identifier)
        defaultValue: DataTypes.UUIDV4,   //valor por default UUIDV4 que es un standard
        allowNull: false,                 //no puede ser null
        primaryKey: true,                 
        },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
        },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    img: {
        type: DataTypes.STRING,           //URL
        },
    createdInDb: {                  
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,           //se añade automaticamente a cada user creado
        }    
  });
};
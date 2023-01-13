const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('videogame', {
    id: {
      type: DataTypes.UUID,             //UUID genera un codigo random único con letras y numeros. DataType de Sequelize(Universal Unique Identifier)
      defaultValue: DataTypes.UUIDV4,   //valor por default UUIDV4 que es un standard
      allowNull: false,                 //no puede ser null
      primaryKey: true,                 
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    release:{
      type: DataTypes.STRING,
      allowNull: true,
    },
    rating:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    platforms:{
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    // genre:{
    //   type:DataTypes.STRING,
    //   allowNull: true,
    // },
    image:{
      type: DataTypes.STRING,
      defaultValue:"https://images.unsplash.com/photo-1585620385456-4759f9b5c7d9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"

    },
    createdInDb: {                  //prop que me va a permitir acceder solo a los vdg creados en la db
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,           //se añade automaticamente a cada pokemon creado
    }
  });
};

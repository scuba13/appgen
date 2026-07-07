{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true,
    "emitDeclarationOnly": false,
    "noEmit": false,
    "module": "CommonJS",
    "moduleResolution": "Node"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["dist", "node_modules"]
}

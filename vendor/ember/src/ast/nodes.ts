// EC-1: Clang JSON AST node type definitions.
// These interfaces match the output of: clang -Xclang -ast-dump=json -fsyntax-only
// Covers all node kinds needed for C17 and C++20 translation.

// --- Base types ---

export interface SourceLocation {
  offset?: number;
  file?: string;
  line?: number;
  col?: number;
  tokLen?: number;
  includedFrom?: { file: string };
}

export interface SourceRange {
  begin: SourceLocation;
  end: SourceLocation;
}

export interface QualType {
  qualType: string;
  desugaredQualType?: string;
  typeAliasDeclId?: string;
}

/** Base interface for all Clang AST nodes. */
export interface ASTNode {
  id: string;
  kind: string;
  loc?: SourceLocation;
  range?: SourceRange;
  inner?: ASTNode[];
  isImplicit?: boolean;
  // Generic fields that appear on various node types:
  name?: string;
  type?: QualType;
  value?: string | number | boolean;
  opcode?: string;
  castKind?: string;
  isPostfix?: boolean;
  isArrow?: boolean;
  referencedDecl?: { id: string; kind: string; name: string; type: QualType };
  referencedMemberDecl?: string;
  storageClass?: string;
  mangledName?: string;
  inline?: boolean;
  constexpr?: boolean;
  variadic?: boolean;
  virtual?: boolean;
  pure?: boolean;
  init?: "c" | "call" | "list";
  isUsed?: boolean;
  isReferenced?: boolean;
  nrvo?: boolean;
  tagUsed?: "struct" | "class" | "union";
  completeDefinition?: boolean;
  isBitfield?: boolean;
  hasElse?: boolean;
  isConstexpr?: boolean;
  isArray?: boolean;
  isGlobal?: boolean;
  isArrayForm?: boolean;
  isGlobalDelete?: boolean;
  access?: "public" | "protected" | "private";
  scopedEnumTag?: "class" | "struct";
  fixedUnderlyingType?: QualType;
  hadMultipleCandidates?: boolean;
  constructionKind?: string;
  storageDuration?: string;
  boundToLValueRef?: boolean;
  cleanupsHaveSideEffects?: boolean;
  canOverflow?: boolean;
  explicitlyDefaulted?: string;
  isInline?: boolean;
  computeLHSType?: QualType;
  computeResultType?: QualType;
  targetLabelDeclId?: string;
  declId?: string;
  nominatedNamespace?: { id: string; kind: string; name: string };
  definitionData?: {
    isAggregate?: boolean;
    isStandardLayout?: boolean;
    isTrivial?: boolean;
    isPOD?: boolean;
    isPolymorphic?: boolean;
    isAbstract?: boolean;
  };
  bases?: Array<{
    access: "public" | "protected" | "private";
    type: QualType;
    isVirtual?: boolean;
  }>;
}

// --- Node kind constants ---

export const DECL_KINDS = [
  "TranslationUnitDecl", "FunctionDecl", "ParmVarDecl", "VarDecl",
  "TypedefDecl", "TypeAliasDecl", "EnumDecl", "EnumConstantDecl",
  "CXXRecordDecl", "RecordDecl", "FieldDecl",
  "CXXMethodDecl", "CXXConstructorDecl", "CXXDestructorDecl",
  "AccessSpecDecl", "NamespaceDecl", "UsingDirectiveDecl", "UsingDecl",
  "ClassTemplateDecl", "FunctionTemplateDecl",
  "ClassTemplateSpecializationDecl", "StaticAssertDecl",
  "LinkageSpecDecl", "FriendDecl", "IndirectFieldDecl",
  "CXXConversionDecl", "TypeAliasTemplateDecl",
  "DecompositionDecl", "BindingDecl",
] as const;

export const STMT_KINDS = [
  "CompoundStmt", "DeclStmt", "ReturnStmt",
  "IfStmt", "WhileStmt", "DoStmt", "ForStmt", "CXXForRangeStmt",
  "SwitchStmt", "CaseStmt", "DefaultStmt",
  "BreakStmt", "ContinueStmt", "NullStmt",
  "GotoStmt", "LabelStmt",
  "CXXTryStmt", "CXXCatchStmt",
  "GCCAsmStmt", "AttributedStmt",
] as const;

export const EXPR_KINDS = [
  "IntegerLiteral", "FloatingLiteral", "StringLiteral", "CharacterLiteral",
  "CXXBoolLiteralExpr", "CXXNullPtrLiteralExpr",
  "DeclRefExpr", "BinaryOperator", "CompoundAssignOperator",
  "UnaryOperator", "ConditionalOperator", "ParenExpr",
  "CallExpr", "CXXOperatorCallExpr", "CXXMemberCallExpr",
  "MemberExpr", "ArraySubscriptExpr",
  "ImplicitCastExpr", "CStyleCastExpr",
  "CXXStaticCastExpr", "CXXDynamicCastExpr",
  "CXXReinterpretCastExpr", "CXXConstCastExpr", "CXXFunctionalCastExpr",
  "CXXThrowExpr", "CXXNewExpr", "CXXDeleteExpr",
  "CXXConstructExpr", "CXXTemporaryObjectExpr",
  "CXXDefaultArgExpr", "CXXDefaultInitExpr",
  "MaterializeTemporaryExpr", "ExprWithCleanups",
  "LambdaExpr", "InitListExpr",
  "CXXThisExpr", "UnaryExprOrTypeTraitExpr",
  "CXXBindTemporaryExpr", "CXXStdInitializerListExpr",
  "PackExpansionExpr", "SizeOfPackExpr",
  "CXXDependentScopeMemberExpr", "CXXUnresolvedConstructExpr",
  "SubstNonTypeTemplateParmExpr",
  "UserDefinedLiteral", "CompoundLiteralExpr",
  "StmtExpr", "DesignatedInitExpr", "ImplicitValueInitExpr",
  "PredefinedExpr", "ConstantExpr",
  "CXXNoexceptExpr", "TypeTraitExpr",
  "GNUNullExpr", "VAArgExpr",
  "OpaqueValueExpr", "BinaryConditionalOperator",
  "CXXScalarValueInitExpr", "CXXPseudoDestructorExpr",
  "AtomicExpr",
] as const;

/** Check if a node kind is a declaration. */
export function isDecl(kind: string): boolean {
  return kind.endsWith("Decl");
}

/** Check if a node kind is a statement. */
export function isStmt(kind: string): boolean {
  return kind.endsWith("Stmt");
}

/** Check if a node kind is an expression. */
export function isExpr(kind: string): boolean {
  return kind.endsWith("Expr") || kind.endsWith("Literal") || kind.endsWith("Operator");
}

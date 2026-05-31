/**
 * TypeScript interfaces for Clang's JSON AST dump.
 * Generated from: clang -Xclang -ast-dump=json -fsyntax-only
 *
 * Covers AST node types needed for Phases 0–9.
 * Extended incrementally as new node types are encountered.
 */

/** Base interface for all AST nodes */
export interface ASTNode {
  id: string;
  kind: string;
  loc?: SourceLocation;
  range?: SourceRange;
  inner?: ASTNode[];
  isImplicit?: boolean;
}

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

/** Type information as Clang represents it */
export interface QualType {
  qualType: string;
  desugaredQualType?: string;
  typeAliasDeclId?: string;
}

// ── Top-level ──────────────────────────────────────────────

export interface TranslationUnitDecl extends ASTNode {
  kind: "TranslationUnitDecl";
}

// ── Declarations ───────────────────────────────────────────

export interface FunctionDecl extends ASTNode {
  kind: "FunctionDecl";
  name: string;
  mangledName?: string;
  type: QualType;
  storageClass?: string;
  inline?: boolean;
  constexpr?: boolean;
  variadic?: boolean;
}

export interface ParmVarDecl extends ASTNode {
  kind: "ParmVarDecl";
  name?: string;
  type: QualType;
  init?: "c" | "call" | "list";
}

export interface VarDecl extends ASTNode {
  kind: "VarDecl";
  name: string;
  type: QualType;
  storageClass?: string;
  init?: "c" | "call" | "list";
  isUsed?: boolean;
  isReferenced?: boolean;
  nrvo?: boolean;
}

export interface TypedefDecl extends ASTNode {
  kind: "TypedefDecl";
  name: string;
  type: QualType;
}

export interface TypeAliasDecl extends ASTNode {
  kind: "TypeAliasDecl";
  name: string;
  type: QualType;
}

export interface EnumDecl extends ASTNode {
  kind: "EnumDecl";
  name?: string;
  fixedUnderlyingType?: QualType;
  scopedEnumTag?: "class" | "struct";
}

export interface EnumConstantDecl extends ASTNode {
  kind: "EnumConstantDecl";
  name: string;
  type: QualType;
}

// ── C++ Record (struct/class) ──────────────────────────────

export interface CXXRecordDecl extends ASTNode {
  kind: "CXXRecordDecl";
  name?: string;
  tagUsed?: "struct" | "class" | "union";
  completeDefinition?: boolean;
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

export interface FieldDecl extends ASTNode {
  kind: "FieldDecl";
  name: string;
  type: QualType;
  isBitfield?: boolean;
}

export interface CXXMethodDecl extends ASTNode {
  kind: "CXXMethodDecl";
  name: string;
  type: QualType;
  virtual?: boolean;
  pure?: boolean;
  constexpr?: boolean;
  storageClass?: string;
}

export interface CXXConstructorDecl extends ASTNode {
  kind: "CXXConstructorDecl";
  name: string;
  type: QualType;
  isImplicit?: boolean;
  explicitlyDefaulted?: string;
}

export interface CXXDestructorDecl extends ASTNode {
  kind: "CXXDestructorDecl";
  name: string;
  type: QualType;
  isImplicit?: boolean;
  virtual?: boolean;
}

export interface AccessSpecDecl extends ASTNode {
  kind: "AccessSpecDecl";
  access: "public" | "protected" | "private";
}

// ── Statements ─────────────────────────────────────────────

export interface CompoundStmt extends ASTNode {
  kind: "CompoundStmt";
}

export interface DeclStmt extends ASTNode {
  kind: "DeclStmt";
}

export interface ReturnStmt extends ASTNode {
  kind: "ReturnStmt";
}

export interface IfStmt extends ASTNode {
  kind: "IfStmt";
  hasElse?: boolean;
  isConstexpr?: boolean;
}

export interface WhileStmt extends ASTNode {
  kind: "WhileStmt";
}

export interface DoStmt extends ASTNode {
  kind: "DoStmt";
}

export interface ForStmt extends ASTNode {
  kind: "ForStmt";
}

export interface CXXForRangeStmt extends ASTNode {
  kind: "CXXForRangeStmt";
}

export interface SwitchStmt extends ASTNode {
  kind: "SwitchStmt";
}

export interface CaseStmt extends ASTNode {
  kind: "CaseStmt";
}

export interface DefaultStmt extends ASTNode {
  kind: "DefaultStmt";
}

export interface BreakStmt extends ASTNode {
  kind: "BreakStmt";
}

export interface ContinueStmt extends ASTNode {
  kind: "ContinueStmt";
}

export interface NullStmt extends ASTNode {
  kind: "NullStmt";
}

export interface GotoStmt extends ASTNode {
  kind: "GotoStmt";
  targetLabelDeclId: string;
}

export interface LabelStmt extends ASTNode {
  kind: "LabelStmt";
  name: string;
  declId: string;
}

// ── Expressions ────────────────────────────────────────────

export interface IntegerLiteral extends ASTNode {
  kind: "IntegerLiteral";
  value: string;
  type: QualType;
}

export interface FloatingLiteral extends ASTNode {
  kind: "FloatingLiteral";
  value: string;
  type: QualType;
}

export interface StringLiteral extends ASTNode {
  kind: "StringLiteral";
  value: string;
  type: QualType;
}

export interface CharacterLiteral extends ASTNode {
  kind: "CharacterLiteral";
  value: number;
  type: QualType;
}

export interface CXXBoolLiteralExpr extends ASTNode {
  kind: "CXXBoolLiteralExpr";
  value: boolean;
  type: QualType;
}

export interface CXXNullPtrLiteralExpr extends ASTNode {
  kind: "CXXNullPtrLiteralExpr";
  type: QualType;
}

export interface DeclRefExpr extends ASTNode {
  kind: "DeclRefExpr";
  referencedDecl: {
    id: string;
    kind: string;
    name: string;
    type: QualType;
  };
  type: QualType;
}

export interface BinaryOperator extends ASTNode {
  kind: "BinaryOperator";
  opcode: string;
  type: QualType;
}

export interface CompoundAssignOperator extends ASTNode {
  kind: "CompoundAssignOperator";
  opcode: string;
  type: QualType;
  computeLHSType?: QualType;
  computeResultType?: QualType;
}

export interface UnaryOperator extends ASTNode {
  kind: "UnaryOperator";
  opcode: string;
  isPostfix: boolean;
  type: QualType;
  canOverflow?: boolean;
}

export interface ConditionalOperator extends ASTNode {
  kind: "ConditionalOperator";
  type: QualType;
}

export interface ParenExpr extends ASTNode {
  kind: "ParenExpr";
  type: QualType;
}

export interface CallExpr extends ASTNode {
  kind: "CallExpr";
  type: QualType;
}

export interface CXXOperatorCallExpr extends ASTNode {
  kind: "CXXOperatorCallExpr";
  type: QualType;
}

export interface CXXMemberCallExpr extends ASTNode {
  kind: "CXXMemberCallExpr";
  type: QualType;
}

export interface MemberExpr extends ASTNode {
  kind: "MemberExpr";
  name: string;
  isArrow: boolean;
  referencedMemberDecl: string;
  type: QualType;
}

export interface ArraySubscriptExpr extends ASTNode {
  kind: "ArraySubscriptExpr";
  type: QualType;
}

export interface ImplicitCastExpr extends ASTNode {
  kind: "ImplicitCastExpr";
  castKind: string;
  type: QualType;
}

export interface CStyleCastExpr extends ASTNode {
  kind: "CStyleCastExpr";
  castKind: string;
  type: QualType;
}

export interface CXXStaticCastExpr extends ASTNode {
  kind: "CXXStaticCastExpr";
  castKind: string;
  type: QualType;
}

export interface CXXDynamicCastExpr extends ASTNode {
  kind: "CXXDynamicCastExpr";
  castKind: string;
  type: QualType;
}

export interface CXXReinterpretCastExpr extends ASTNode {
  kind: "CXXReinterpretCastExpr";
  castKind: string;
  type: QualType;
}

export interface CXXConstCastExpr extends ASTNode {
  kind: "CXXConstCastExpr";
  castKind: string;
  type: QualType;
}

export interface CXXFunctionalCastExpr extends ASTNode {
  kind: "CXXFunctionalCastExpr";
  castKind: string;
  type: QualType;
}

// ── Exception handling ─────────────────────────────────────

export interface CXXThrowExpr extends ASTNode {
  kind: "CXXThrowExpr";
  type: QualType;
}

export interface CXXTryStmt extends ASTNode {
  kind: "CXXTryStmt";
}

export interface CXXCatchStmt extends ASTNode {
  kind: "CXXCatchStmt";
}

// ── C++ new/delete ─────────────────────────────────────────

export interface CXXNewExpr extends ASTNode {
  kind: "CXXNewExpr";
  type: QualType;
  isArray?: boolean;
  isGlobal?: boolean;
}

export interface CXXDeleteExpr extends ASTNode {
  kind: "CXXDeleteExpr";
  type: QualType;
  isArrayForm?: boolean;
  isGlobalDelete?: boolean;
}

// ── C++ construction/temporaries ───────────────────────────

export interface CXXConstructExpr extends ASTNode {
  kind: "CXXConstructExpr";
  type: QualType;
  hadMultipleCandidates?: boolean;
  constructionKind?: string;
}

export interface CXXTemporaryObjectExpr extends ASTNode {
  kind: "CXXTemporaryObjectExpr";
  type: QualType;
}

export interface CXXDefaultArgExpr extends ASTNode {
  kind: "CXXDefaultArgExpr";
  type: QualType;
}

export interface CXXDefaultInitExpr extends ASTNode {
  kind: "CXXDefaultInitExpr";
  type: QualType;
}

export interface MaterializeTemporaryExpr extends ASTNode {
  kind: "MaterializeTemporaryExpr";
  type: QualType;
  storageDuration?: string;
  boundToLValueRef?: boolean;
}

export interface ExprWithCleanups extends ASTNode {
  kind: "ExprWithCleanups";
  type: QualType;
  cleanupsHaveSideEffects?: boolean;
}

// ── Lambdas ────────────────────────────────────────────────

export interface LambdaExpr extends ASTNode {
  kind: "LambdaExpr";
  type: QualType;
}

// ── Init list ──────────────────────────────────────────────

export interface InitListExpr extends ASTNode {
  kind: "InitListExpr";
  type: QualType;
}

// ── Templates (instantiated) ───────────────────────────────

export interface ClassTemplateSpecializationDecl extends ASTNode {
  kind: "ClassTemplateSpecializationDecl";
  name: string;
  type: QualType;
}

// ── This ───────────────────────────────────────────────────

export interface CXXThisExpr extends ASTNode {
  kind: "CXXThisExpr";
  type: QualType;
}

// ── Static assert ──────────────────────────────────────────

export interface StaticAssertDecl extends ASTNode {
  kind: "StaticAssertDecl";
}

// ── Namespace ──────────────────────────────────────────────

export interface NamespaceDecl extends ASTNode {
  kind: "NamespaceDecl";
  name?: string;
  isInline?: boolean;
}

export interface UsingDirectiveDecl extends ASTNode {
  kind: "UsingDirectiveDecl";
  nominatedNamespace: { id: string; kind: string; name: string };
}

export interface UsingDecl extends ASTNode {
  kind: "UsingDecl";
  name: string;
}

// ── Full width text (for things we pass through) ───────────

export interface FullComment extends ASTNode {
  kind: "FullComment";
}

// ── Union of all known node types for type narrowing ───────

export type KnownNode =
  | TranslationUnitDecl
  | FunctionDecl
  | ParmVarDecl
  | VarDecl
  | TypedefDecl
  | TypeAliasDecl
  | EnumDecl
  | EnumConstantDecl
  | CXXRecordDecl
  | FieldDecl
  | CXXMethodDecl
  | CXXConstructorDecl
  | CXXDestructorDecl
  | AccessSpecDecl
  | CompoundStmt
  | DeclStmt
  | ReturnStmt
  | IfStmt
  | WhileStmt
  | DoStmt
  | ForStmt
  | CXXForRangeStmt
  | SwitchStmt
  | CaseStmt
  | DefaultStmt
  | BreakStmt
  | ContinueStmt
  | NullStmt
  | GotoStmt
  | LabelStmt
  | IntegerLiteral
  | FloatingLiteral
  | StringLiteral
  | CharacterLiteral
  | CXXBoolLiteralExpr
  | CXXNullPtrLiteralExpr
  | DeclRefExpr
  | BinaryOperator
  | CompoundAssignOperator
  | UnaryOperator
  | ConditionalOperator
  | ParenExpr
  | CallExpr
  | CXXOperatorCallExpr
  | CXXMemberCallExpr
  | MemberExpr
  | ArraySubscriptExpr
  | ImplicitCastExpr
  | CStyleCastExpr
  | CXXStaticCastExpr
  | CXXDynamicCastExpr
  | CXXReinterpretCastExpr
  | CXXConstCastExpr
  | CXXFunctionalCastExpr
  | CXXThrowExpr
  | CXXTryStmt
  | CXXCatchStmt
  | CXXNewExpr
  | CXXDeleteExpr
  | CXXConstructExpr
  | CXXTemporaryObjectExpr
  | CXXDefaultArgExpr
  | CXXDefaultInitExpr
  | MaterializeTemporaryExpr
  | ExprWithCleanups
  | LambdaExpr
  | InitListExpr
  | ClassTemplateSpecializationDecl
  | CXXThisExpr
  | StaticAssertDecl
  | NamespaceDecl
  | UsingDirectiveDecl
  | UsingDecl
  | FullComment;

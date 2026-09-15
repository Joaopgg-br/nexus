export interface CursoExterno {
  id: string;
  moodle_curso_id: number;
  titulo: string;
  resumo: string;
  url: string;
  progresso: number | null;
  concluido: boolean | null;
  sincronizado_em: string;
}
export interface ConexaoMoodle {
  usuario_id: string;
  site_url: string;
  site_nome: string;
  moodle_usuario_id: number;
  moodle_nome: string;
  revisao: string;
  sincronizado_em: string;
}
export interface EstadoMoodle {
  configured: boolean;
  siteUrl: string | null;
  connection: ConexaoMoodle | null;
  courses: CursoExterno[];
}
export type AcaoMoodle = 'status' | 'connect' | 'sync' | 'disconnect';

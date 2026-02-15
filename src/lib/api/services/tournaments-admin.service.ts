import type { CreateTournamentRequestDto, TournamentDto } from "@/dto/tournament";
import { ApiClient } from "@/lib/api/api-client";
import { BaseCrudService } from "@/lib/api/base-crud-service";

type UploadCoverApiResponse = {
    success: boolean;
    file: { imageFileId: string; publicUrl: string | null } | null;
    message?: string;
};

export class TournamentsAdminService extends BaseCrudService {
    private static readonly resourcePath = "/admin/tournaments";

    static create(payload: CreateTournamentRequestDto) {
        return this.createEntity<CreateTournamentRequestDto, TournamentDto, "tournament">(
            this.resourcePath,
            payload,
            "tournament",
        );
    }

    static update(id: string, payload: CreateTournamentRequestDto) {
        return this.updateEntity<CreateTournamentRequestDto, TournamentDto, "tournament">(
            this.resourcePath,
            id,
            payload,
            "tournament",
        );
    }

    static remove(id: string) {
        return this.removeEntity(this.resourcePath, id);
    }

    static getAll() {
        return this.listEntities<TournamentDto, "tournaments">(this.resourcePath, "tournaments");
    }

    static uploadCover(formData: FormData) {
        return ApiClient.postFormData<UploadCoverApiResponse>("/admin/uploads/tournaments", formData);
    }
}
